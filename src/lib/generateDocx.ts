import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType,
  AlignmentType,
  BorderStyle,
  ImageRun,
  VerticalAlign,
  TabStopType,
  TabStopPosition,
  UnderlineType,
} from "docx";
import { saveAs } from "file-saver";
import QRCode from "qrcode";
import { DocumentInfo, Experiment } from "./types";

const FONT = "Times New Roman";
const LINK_COLOR = "0563C1";
const BORDER = { style: BorderStyle.SINGLE, size: 1, color: "auto" };
const CELL_MARGINS = { top: 160, left: 160, bottom: 160, right: 160 };

function font(size: number, bold = false, color?: string, underline = false) {
  return {
    font: FONT,
    size,
    bold,
    color,
    underline: underline ? { type: UnderlineType.SINGLE } : undefined,
  };
}

function centered(children: TextRun[]) {
  return new Paragraph({ alignment: AlignmentType.CENTER, children });
}

function cell(children: Paragraph[], widthDxa: number): TableCell {
  return new TableCell({
    children,
    width: { size: widthDxa, type: WidthType.DXA },
    borders: { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER },
    margins: CELL_MARGINS,
    verticalAlign: VerticalAlign.CENTER,
  });
}

async function getQRBuffer(url: string): Promise<Uint8Array | null> {
  if (!url) return null;
  try {
    const dataUrl = await QRCode.toDataURL(url, { width: 80, margin: 1 });
    const base64 = dataUrl.split(",")[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

async function getLogoBuffer(): Promise<Uint8Array | null> {
  try {
    const res = await fetch("/saveetha-logo.png");
    const ab = await res.arrayBuffer();
    return new Uint8Array(ab);
  } catch {
    return null;
  }
}

export async function generateDOCX(docInfo: DocumentInfo, experiments: Experiment[]) {
  const logoBuffer = await getLogoBuffer();

  // Header paragraph with logo image (cx: 6858000, cy: 1666875 — from reference)
  const headerChildren: Paragraph[] = [];
  if (logoBuffer) {
    headerChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new ImageRun({
            data: logoBuffer,
            transformation: { width: 486, height: 118 }, // 6858000 / 12700 ≈ 540pt → 486px; 1666875/12700≈131pt→118px
            type: "png",
          }),
        ],
      })
    );
  }

  // Course title — Bold, Times New Roman, 18pt (sz=36)
  headerChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ ...font(36, true), text: docInfo.courseFullTitle || "" })],
    }),
    // Table of content — Bold, 16pt (sz=32)
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [new TextRun({ ...font(32, true), text: "Table of content" })],
    })
  );

  // Column widths from reference: 800, 1400, 4300, 1400, 900, 1300
  const COL = [800, 1400, 4300, 1400, 900, 1300];

  // Header row — Bold, 12pt (sz=24), centered
  const headerRow = new TableRow({
    children: [
      cell([centered([new TextRun({ ...font(24, true), text: "Exp" })])], COL[0]),
      cell([centered([new TextRun({ ...font(24, true), text: "Date" })])], COL[1]),
      cell([centered([new TextRun({ ...font(24, true), text: "Name of The Experiment" })])], COL[2]),
      cell([centered([new TextRun({ ...font(24, true), text: "QR Code" })])], COL[3]),
      cell([centered([new TextRun({ ...font(24, true), text: "Mark" })])], COL[4]),
      cell([centered([new TextRun({ ...font(24, true), text: "Signature" })])], COL[5]),
    ],
  });

  // Data rows
  const dataRows: TableRow[] = [];
  for (const exp of experiments) {
    const qrBuf = exp.githubLink ? await getQRBuffer(exp.githubLink) : null;

    // Format date as DD/MM/YYYY
    let dateStr = exp.date;
    if (dateStr && dateStr.includes("-")) {
      const [y, m, d] = dateStr.split("-");
      dateStr = `${d}/${m}/${y}`;
    }

    // Name cell: title + blank line + github link (underlined blue, sz=22)
    const nameCellChildren: Paragraph[] = [
      new Paragraph({
        spacing: { line: 200 },
        children: [new TextRun({ ...font(24), text: exp.title })],
      }),
      new Paragraph({ children: [new TextRun({ text: "" })] }),
      new Paragraph({
        spacing: { line: 200 },
        children: [
          new TextRun({
            ...font(22, false, LINK_COLOR, true),
            text: exp.githubLink || "",
          }),
        ],
      }),
    ];

    // QR cell with image (685800 EMU = 54pt ≈ 77px)
    const qrCellChildren: Paragraph[] = qrBuf
      ? [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                data: qrBuf,
                transformation: { width: 77, height: 77 },
                type: "png",
              }),
            ],
          }),
        ]
      : [new Paragraph({ children: [new TextRun({ text: "" })] })];

    dataRows.push(
      new TableRow({
        children: [
          cell([centered([new TextRun({ ...font(24), text: String(exp.serialNo).padStart(2, "0") })])], COL[0]),
          cell([centered([new TextRun({ ...font(24), text: dateStr || "" })])], COL[1]),
          cell(nameCellChildren, COL[2]),
          cell(qrCellChildren, COL[3]),
          cell([new Paragraph({ children: [new TextRun({ ...font(24), text: "" })] })], COL[4]),
          cell([new Paragraph({ children: [new TextRun({ ...font(24), text: "" })] })], COL[5]),
        ],
      })
    );
  }

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });

  // Declaration and signature (tab stop at 7000 twips, matching reference)
  const TAB_POS = { type: TabStopType.LEFT, position: 7000 };

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 }, // A4 in twips
            margin: { top: 440, right: 720, bottom: 720, left: 720 },
          },
        },
        children: [
          ...headerChildren,
          table,
          new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "" })] }),
          // Declaration
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                ...font(24, true, undefined, false),
                italics: true,
                text: "I confirm that the experiments and GitHub links provided are entirely my own work.",
              } as any),
            ],
          }),
          new Paragraph({ children: [new TextRun({ text: "" })] }),
          // Name + Register Number
          new Paragraph({
            tabStops: [TAB_POS],
            children: [
              new TextRun({ ...font(24), text: `Name : ${docInfo.studentName || ""}` }),
              new TextRun({ text: "\t" }),
              new TextRun({ ...font(24), text: `Register Number : ${docInfo.registerNumber || ""}` }),
            ],
          }),
          new Paragraph({ children: [new TextRun({ text: "" })] }),
          // Date + Learner's Signature
          new Paragraph({
            tabStops: [TAB_POS],
            children: [
              new TextRun({ ...font(24), text: `Date :` }),
              new TextRun({ text: "\t" }),
              new TextRun({ ...font(24), text: "Learner's Signature" }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const sanitizedTitle = (docInfo.courseFullTitle || "LabRecord").replace(/[^a-zA-Z0-9()._-]/g, "_");
  const fileName = `${sanitizedTitle}(${docInfo.registerNumber || "RegNo"}).docx`;
  saveAs(blob, fileName);
}
