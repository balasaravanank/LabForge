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
  UnderlineType,
} from "docx";
import { saveAs } from "file-saver";
import QRCode from "qrcode";
import { DocumentInfo, Experiment } from "./types";

const FONT = "Times New Roman";
const LINK_COLOR = "0563C1";
const BORDER = { style: BorderStyle.SINGLE, size: 1, color: "auto" };
// Matches PDF: CELL_PAD = 1.5mm → ~113 twips; using 160 (≈2.3mm) is fine
const CELL_MARGINS = { top: 113, left: 113, bottom: 113, right: 113 };

function fontProps(
  sizePt: number,
  bold = false,
  color?: string,
  underline = false,
  italics = false
) {
  return {
    font: FONT,
    size: sizePt * 2, // half-points
    bold,
    italics,
    color,
    underline: underline ? { type: UnderlineType.SINGLE } : undefined,
  };
}

function centered(children: TextRun[]): Paragraph {
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

// Wrap a long URL string into chunks fitting within a given char-width estimate
function wrapText(text: string, maxChars: number): string[] {
  if (!text) return [""];
  const words = text.split(/(\s+)/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + word).length > maxChars && current.length > 0) {
      lines.push(current.trimEnd());
      current = word.trimStart();
    } else {
      current += word;
    }
  }
  if (current.trim()) lines.push(current.trim());
  return lines.length > 0 ? lines : [text];
}

export async function generateDOCX(docInfo: DocumentInfo, experiments: Experiment[]) {
  const logoBuffer = await getLogoBuffer();

  // ── LOGO ─────────────────────────────────────────────────────────────────
  const headerChildren: Paragraph[] = [];
  if (logoBuffer) {
    headerChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new ImageRun({
            data: logoBuffer,
            // cx=6858000 EMU, cy=1666875 EMU; 1 EMU = 1/914400 inch; at 96dpi
            // width = 6858000/914400*96 ≈ 720px; height = 1666875/914400*96 ≈ 175px
            transformation: { width: 646, height: 157 },
            type: "png",
          }),
        ],
      })
    );
  }

  // ── COURSE TITLE — Bold, Times New Roman, 18pt ───────────────────────────
  headerChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ ...fontProps(18, true), text: docInfo.courseFullTitle || "" })],
    }),
    // ── TABLE OF CONTENT — Bold, 16pt ─────────────────────────────────────
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [new TextRun({ ...fontProps(16, true), text: "Table of content" })],
    })
  );

  // ── COLUMN WIDTHS — matching PDF exactly (twips) ─────────────────────────
  // Reference: 800, 1400, 4300, 1400, 900, 1300 (total: 10100 twips)
  const COL = [800, 1400, 4300, 1400, 900, 1300];

  // ── HEADER ROW — Bold, 12pt, centered ────────────────────────────────────
  const headerLabels = ["Exp", "Date", "Name of The Experiment", "QR Code", "Mark", "Signature"];
  const headerRow = new TableRow({
    children: headerLabels.map((label, i) =>
      cell([centered([new TextRun({ ...fontProps(12, true), text: label })])], COL[i])
    ),
  });

  // ── DATA ROWS ─────────────────────────────────────────────────────────────
  const dataRows: TableRow[] = [];
  for (const exp of experiments) {
    const qrBuf = exp.githubLink ? await getQRBuffer(exp.githubLink) : null;

    // Format date DD/MM/YYYY (matches PDF formatDate)
    let dateStr = exp.date || "";
    if (dateStr.includes("-")) {
      const [y, m, d] = dateStr.split("-");
      dateStr = `${d}/${m}/${y}`;
    }

    // Name cell: title (bold 12pt) + blank line + link (normal blue underlined, 11pt)
    // GitHub link: wrap long URLs at ~55 chars (approx match for PDF's splitTextToSize)
    const linkLines = exp.githubLink ? wrapText(exp.githubLink, 55) : [];

    const nameCellChildren: Paragraph[] = [
      // Experiment title — bold, 12pt (matches PDF: bold 12pt)
      new Paragraph({
        children: [new TextRun({ ...fontProps(12, true), text: exp.title })],
      }),
      // Blank gap line
      new Paragraph({ children: [new TextRun({ text: "" })] }),
      // GitHub link lines — normal, blue, underlined, 11pt (matches PDF: LINK_COLOR, 11pt)
      ...linkLines.map(
        (line) =>
          new Paragraph({
            children: [
              new TextRun({
                ...fontProps(11, false, LINK_COLOR, true),
                text: line,
              }),
            ],
          })
      ),
    ];

    // QR code — 685800 EMU ≈ 54pt ≈ 72px at 96dpi
    const qrSize = 72;
    const qrCellChildren: Paragraph[] = qrBuf
      ? [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                data: qrBuf,
                transformation: { width: qrSize, height: qrSize },
                type: "png",
              }),
            ],
          }),
        ]
      : [new Paragraph({ children: [new TextRun({ text: "" })] })];

    dataRows.push(
      new TableRow({
        children: [
          // Exp number — bold, 12pt, centered (matches PDF)
          cell(
            [centered([new TextRun({ ...fontProps(12, true), text: String(exp.serialNo).padStart(2, "0") })])],
            COL[0]
          ),
          // Date — normal, 12pt, centered
          cell(
            [centered([new TextRun({ ...fontProps(12), text: dateStr })])],
            COL[1]
          ),
          // Name + link
          cell(nameCellChildren, COL[2]),
          // QR code
          cell(qrCellChildren, COL[3]),
          // Mark (empty)
          cell([new Paragraph({ children: [new TextRun({ text: "" })] })], COL[4]),
          // Signature (empty)
          cell([new Paragraph({ children: [new TextRun({ text: "" })] })], COL[5]),
        ],
      })
    );
  }

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });

  // ── DECLARATION + FOOTER ─────────────────────────────────────────────────
  // Tab stop matching PDF: name on left, register number pushed right
  // 5500 twips ≈ middle-right of A4 content area, ensuring left-alignment stays straight
  const TAB_RIGHT = 5500;

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 }, // A4 in twips
            // Margins matching PDF: top=440twips(7.76mm), left/right=720twips(12.7mm)
            margin: { top: 440, right: 720, bottom: 720, left: 720 },
          },
        },
        children: [
          ...headerChildren,
          table,
          // Spacer after table (matches PDF: yPos += 10)
          new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: "" })] }),
          // Declaration — bold-italic, 12pt (matches PDF: bolditalic 12pt)
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                ...fontProps(12, true, undefined, false, true),
                text: "I confirm that the experiments and GitHub links provided are entirely my own work.",
              } as any),
            ],
          }),
          // Spacer
          new Paragraph({ children: [new TextRun({ text: "" })] }),
          // Name + Register Number on same line (tab-separated)
          new Paragraph({
            tabStops: [{ type: TabStopType.LEFT, position: TAB_RIGHT }],
            children: [
              new TextRun({ ...fontProps(12), text: `Name : ${docInfo.studentName || ""}` }),
              new TextRun({ text: "\t" }),
              new TextRun({ ...fontProps(12), text: `Register Number : ${docInfo.registerNumber || ""}` }),
            ],
          }),
          // Spacer
          new Paragraph({ children: [new TextRun({ text: "" })] }),
          // Date + Learner's Signature on same line (tab-separated)
          new Paragraph({
            tabStops: [{ type: TabStopType.LEFT, position: TAB_RIGHT }],
            children: [
              new TextRun({ ...fontProps(12), text: "Date :" }),
              new TextRun({ text: "\t" }),
              new TextRun({ ...fontProps(12), text: "Learner's Signature" }),
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
