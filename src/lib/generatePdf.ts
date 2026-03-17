import jsPDF from "jspdf";
import QRCode from "qrcode";
import { DocumentInfo, Experiment } from "./types";

const BLACK = [0, 0, 0] as [number, number, number];
const LINK_COLOR = [5, 99, 193] as [number, number, number]; // #0563C1

async function getLogoBase64(): Promise<string> {
  const response = await fetch("/saveetha-logo.png");
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function generateQR(url: string): Promise<string> {
  if (!url) return "";
  try {
    return await QRCode.toDataURL(url, { width: 80, margin: 1, errorCorrectionLevel: "M" });
  } catch {
    return "";
  }
}

// Convert YYYY-MM-DD → DD/MM/YYYY
function formatDate(d: string): string {
  if (!d) return "";
  if (d.includes("/")) return d;
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

export async function generatePDF(docInfo: DocumentInfo, experiments: Experiment[]) {
  // A4: 210 x 297mm, margins matching reference (twips → mm: 720twips = ~12.7mm, 440twips = ~7.76mm)
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const mL = 12.7; // left margin (720 twips)
  const mR = 12.7; // right margin
  const mT = 7.76; // top margin (440 twips)
  const contentW = pageW - mL - mR;

  // ── LOGO ────────────────────────────────────────────────────────────────
  let yPos = mT;
  try {
    const logoB64 = await getLogoBase64();
    // Reference logo EMU: cx=6858000, cy=1666875 → ratio ~4.11:1
    // Width = contentW, height proportional
    const logoH = contentW / 4.11;
    pdf.addImage(logoB64, "PNG", mL, yPos, contentW, logoH);
    yPos += logoH + 5;
  } catch {
    // Fallback if logo fails to load
    pdf.setFont("times", "bold");
    pdf.setFontSize(16);
    pdf.setTextColor(...BLACK);
    pdf.text("SAVEETHA ENGINEERING COLLEGE", pageW / 2, yPos + 8, { align: "center" });
    pdf.setFontSize(10);
    pdf.setFont("times", "normal");
    pdf.text("Affiliated to Anna University | Approved by AICTE", pageW / 2, yPos + 14, { align: "center" });
    yPos += 20;
  }

  // ── COURSE TITLE — Bold, Times New Roman, 18pt (sz=36 → 18pt) ────────
  pdf.setFont("times", "bold");
  pdf.setFontSize(18);
  pdf.setTextColor(...BLACK);
  pdf.text(docInfo.courseFullTitle || "", pageW / 2, yPos, { align: "center" });
  yPos += 8;

  // ── TABLE OF CONTENT — Bold, 16pt (sz=32) ────────────────────────────
  pdf.setFontSize(16);
  pdf.text("Table of content", pageW / 2, yPos, { align: "center" });
  yPos += 8;

  // ── TABLE SETUP ────────────────────────────────────────────────────────
  // Reference column widths in twips: 800, 1400, 4300, 1400, 900, 1300 = 10100 total
  // Total content width in mm = contentW
  const TOTAL_TWIPS = 10100;
  const twipsToMM = (t: number) => (t / TOTAL_TWIPS) * contentW;
  const COL_W = [800, 1400, 4300, 1400, 900, 1300].map(twipsToMM);

  const COL_X: number[] = [mL];
  for (let i = 0; i < COL_W.length - 1; i++) {
    COL_X.push(COL_X[i] + COL_W[i]);
  }

  const tableRight = mL + contentW;
  const CELL_PAD = 1.5;
  const ROW_HEADER_H = 9;

  // ── HEADER ROW — bold 12pt ─────────────────────────────────────────────
  pdf.setFont("times", "bold");
  pdf.setFontSize(12);
  pdf.setTextColor(...BLACK);

  const headerLabels = ["Exp", "Date", "Name of The Experiment", "QR Code", "Mark", "Signature"];
  for (let i = 0; i < headerLabels.length; i++) {
    // Draw cell border
    pdf.setDrawColor(...BLACK);
    pdf.setLineWidth(0.2);
    pdf.rect(COL_X[i], yPos, COL_W[i], ROW_HEADER_H, "S");
    // Center text
    pdf.text(
      headerLabels[i],
      COL_X[i] + COL_W[i] / 2,
      yPos + ROW_HEADER_H / 2,
      { align: "center", baseline: "middle" }
    );
  }
  yPos += ROW_HEADER_H;

  // ── DATA ROWS ──────────────────────────────────────────────────────────
  for (const exp of experiments) {
    const qrData = exp.githubLink ? await generateQR(exp.githubLink) : "";
    const dateStr = formatDate(exp.date);

    // Calculate row height
    const nameText = pdf.splitTextToSize(exp.title, COL_W[2] - CELL_PAD * 2);
    const linkText = exp.githubLink
      ? pdf.splitTextToSize(exp.githubLink, COL_W[2] - CELL_PAD * 2)
      : [];
    // 12pt = 4.23mm per line
    const lineH = 4.5;
    const textBlockH = nameText.length * lineH + (linkText.length > 0 ? lineH + linkText.length * lineH : 0);
    const minRowH = qrData ? Math.max(COL_W[3] - 2, 18) : 18;
    const rowH = Math.max(textBlockH + CELL_PAD * 2, minRowH);

    // Draw all cell borders
    for (let i = 0; i < COL_W.length; i++) {
      pdf.setDrawColor(...BLACK);
      pdf.setLineWidth(0.2);
      pdf.rect(COL_X[i], yPos, COL_W[i], rowH, "S");
    }

    // Exp number — bold, centered
    pdf.setFont("times", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(...BLACK);
    pdf.text(
      String(exp.serialNo).padStart(2, "0"),
      COL_X[0] + COL_W[0] / 2,
      yPos + rowH / 2,
      { align: "center", baseline: "middle" }
    );

    // Date — normal, centered
    pdf.setFont("times", "normal");
    pdf.text(dateStr, COL_X[1] + COL_W[1] / 2, yPos + rowH / 2, { align: "center", baseline: "middle" });

    // Name cell — title (bold 12pt) + github link (normal, blue, underlined, 11pt)
    let textY = yPos + CELL_PAD + lineH;
    pdf.setFont("times", "normal");
    pdf.setFontSize(12);
    pdf.setTextColor(...BLACK);
    pdf.text(nameText, COL_X[2] + CELL_PAD, textY);
    textY += nameText.length * lineH + lineH * 0.5;

    if (linkText.length > 0) {
      pdf.setFontSize(11);
      pdf.setTextColor(...LINK_COLOR);
      // Draw underline manually
      for (let li = 0; li < linkText.length; li++) {
        const lineStr = linkText[li];
        const lineY = textY + li * lineH;
        pdf.text(lineStr, COL_X[2] + CELL_PAD, lineY);
        const lineW2 = pdf.getTextWidth(lineStr);
        pdf.setDrawColor(...LINK_COLOR);
        pdf.setLineWidth(0.15);
        pdf.line(COL_X[2] + CELL_PAD, lineY + 0.5, COL_X[2] + CELL_PAD + lineW2, lineY + 0.5);
      }
      pdf.setTextColor(...BLACK);
    }

    // QR code
    if (qrData) {
      const qrSize = Math.min(rowH - 2, COL_W[3] - 2);
      const qrX = COL_X[3] + (COL_W[3] - qrSize) / 2;
      const qrY = yPos + (rowH - qrSize) / 2;
      pdf.addImage(qrData, "PNG", qrX, qrY, qrSize, qrSize);
    }

    yPos += rowH;
  }

  // ── DECLARATION — Bold 12pt ────────────────────────────────────────────
  // Make sure we have enough space for the footer, otherwise add new page
  if (yPos + 50 > 297) {
    pdf.addPage();
    yPos = mT;
  }

  yPos += 10;
  pdf.setFont("times", "bolditalic");
  pdf.setFontSize(12);
  pdf.setTextColor(...BLACK);
  pdf.text(
    "I confirm that the experiments and GitHub links provided are entirely my own work.",
    mL,
    yPos
  );

  yPos += 12;
  pdf.setFont("times", "normal");
  pdf.text(`Name : ${docInfo.studentName || ""}`, mL, yPos);
  pdf.text(`Register Number : ${docInfo.registerNumber || ""}`, pageW - mR - pdf.getTextWidth(`Register Number : ${docInfo.registerNumber || ""}`), yPos);

  yPos += 12;
  pdf.text(`Date :`, mL, yPos);
  pdf.text(`Learner's Signature`, pageW - mR - pdf.getTextWidth(`Learner's Signature`), yPos);

  // ── SAVE ────────────────────────────────────────────────────────────────
  const sanitizedTitle = (docInfo.courseFullTitle || "LabRecord").replace(/[^a-zA-Z0-9()._-]/g, "_");
  const fileName = `${sanitizedTitle}(${docInfo.registerNumber || "RegNo"}).pdf`;
  pdf.save(fileName);
}
