import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { CATEGORY_LABEL, fmtKES, fmtPct } from "./finance";
import type { Report } from "./reports";

/**
 * Generate a styled PDF report and trigger download.
 * PDF generation happens client-side only and is not cached.
 * Only authenticated users can generate reports (enforced by TanStack Router).
 */
export function exportReportPDF(report: Report, opts?: { profile?: string }) {
  // Security: Ensure we're in browser environment
  if (typeof window === "undefined") {
    throw new Error("PDF export is only available in browser environment");
  }

  // Security: Ensure HTTPS in production
  if (window.location.protocol !== "https:" && !window.location.hostname.includes("localhost")) {
    console.warn("[Security] PDF export attempted over non-HTTPS connection");
    throw new Error("PDF export requires a secure connection");
  }

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  let y = 48;

  // ---- Header band
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, W, 90, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("MalinGu", 40, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`${report.period.toUpperCase()} REPORT · ${report.label}`, 40, 64);
  if (opts?.profile) doc.text(opts.profile, W - 40, 64, { align: "right" });
  doc.setTextColor(15, 23, 42);
  y = 120;

  // ---- KPI cards row
  const kpis: Array<[string, string]> = [
    ["Net Worth", fmtKES(report.netWorth)],
    ["Total Assets", fmtKES(report.totalAssets)],
    ["Debt", fmtKES(report.loansOutstanding)],
    ["ROI", fmtPct(report.roi, 2)],
  ];
  const cardW = (W - 80 - 30) / 4;
  kpis.forEach(([label, val], idx) => {
    const x = 40 + idx * (cardW + 10);
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, y, cardW, 60, 6, 6, "FD");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(label.toUpperCase(), x + 10, y + 18);
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text(val, x + 10, y + 42);
    doc.setFont("helvetica", "normal");
  });
  y += 80;

  // ---- This period section
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("This Period", 40, y);
  y += 8;
  autoTable(doc, {
    startY: y + 4,
    head: [["Metric", "Count", "Value"]],
    body: [
      ["Income entries", String(report.incomeCount), fmtKES(report.incomeTotal)],
      ["New investments", String(report.newInvestments), fmtKES(report.newInvestmentsValue)],
    ],
    headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    styles: { fontSize: 10, cellPadding: 6 },
    margin: { left: 40, right: 40 },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 24;

  // ---- Net Worth breakdown
  if (y > 700) { doc.addPage(); y = 48; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Net Worth", 40, y);
  autoTable(doc, {
    startY: y + 8,
    head: [["Component", "Value"]],
    body: [
      ["Investments", fmtKES(report.totalAssets)],
      ["Personal assets", fmtKES(report.personalAssetsValue)],
      ["Receivables (owed to you)", fmtKES(report.loansReceivable)],
      ["Outstanding debt", `- ${fmtKES(report.loansOutstanding)}`],
      ["Net worth", fmtKES(report.netWorth)],
    ],
    headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    bodyStyles: { fontSize: 10, cellPadding: 6 },
    margin: { left: 40, right: 40 },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;

  // ---- Allocation
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Portfolio Allocation", 40, y);
  autoTable(doc, {
    startY: y + 8,
    head: [["Category", "Value", "% of portfolio"]],
    body: report.allocation.length
      ? report.allocation.map((a) => [CATEGORY_LABEL[a.category], fmtKES(a.value), fmtPct(a.pct)])
      : [["—", "No assets yet", ""]],
    headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    styles: { fontSize: 10, cellPadding: 6 },
    margin: { left: 40, right: 40 },
  });

  // Simple horizontal allocation bar chart
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 16;
  if (report.allocation.length) {
    const palette: Array<[number, number, number]> = [
      [59, 130, 246], [16, 185, 129], [245, 158, 11], [139, 92, 246], [236, 72, 153],
    ];
    const barW = W - 80;
    const barH = 18;
    let cx = 40;
    report.allocation.forEach((a, idx) => {
      const w = (a.pct / 100) * barW;
      const [r, g, b] = palette[idx % palette.length];
      doc.setFillColor(r, g, b);
      doc.rect(cx, y, w, barH, "F");
      cx += w;
    });
    y += barH + 14;
    // Legend
    doc.setFontSize(9);
    let lx = 40;
    report.allocation.forEach((a, idx) => {
      const [r, g, b] = palette[idx % palette.length];
      doc.setFillColor(r, g, b);
      doc.rect(lx, y - 8, 10, 10, "F");
      doc.setTextColor(30, 41, 59);
      const txt = `${CATEGORY_LABEL[a.category]} ${fmtPct(a.pct)}`;
      doc.text(txt, lx + 14, y);
      lx += doc.getTextWidth(txt) + 32;
      if (lx > W - 120) { lx = 40; y += 14; }
    });
    y += 16;
  }

  // ---- Income detail
  if (y > 680) { doc.addPage(); y = 48; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Income This Period", 40, y);
  autoTable(doc, {
    startY: y + 8,
    head: [["Date", "Source", "Amount"]],
    body: report.incomeList.length
      ? report.incomeList.map((i) => [new Date(i.date).toLocaleDateString(), i.source, fmtKES(i.amount)])
      : [["—", "No income recorded", ""]],
    headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    styles: { fontSize: 10, cellPadding: 6 },
    margin: { left: 40, right: 40 },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;

  // ---- Expenses
  if (y > 680) { doc.addPage(); y = 48; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(`Expenses This Period — ${fmtKES(report.expensesTotal)}`, 40, y);
  autoTable(doc, {
    startY: y + 8,
    head: [["Date", "Vendor", "Category", "Amount"]],
    body: report.expensesList.length
      ? report.expensesList.map((e) => [new Date(e.date).toLocaleDateString(), e.vendor, e.category, fmtKES(e.amount)])
      : [["—", "No expenses recorded", "", ""]],
    headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    styles: { fontSize: 10, cellPadding: 6 },
    margin: { left: 40, right: 40 },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;

  // ---- Budgets
  if (y > 680) { doc.addPage(); y = 48; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Budgets", 40, y);
  autoTable(doc, {
    startY: y + 8,
    head: [["Category", "Limit", "Spent", "% used"]],
    body: report.budgets.length
      ? report.budgets.map((b) => [b.category, fmtKES(b.limit), fmtKES(b.spent), fmtPct(b.pct)])
      : [["—", "No budgets set", "", ""]],
    headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    styles: { fontSize: 10, cellPadding: 6 },
    margin: { left: 40, right: 40 },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;

  // ---- Upcoming calendar
  if (y > 680) { doc.addPage(); y = 48; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Upcoming (next 14 days)", 40, y);
  autoTable(doc, {
    startY: y + 8,
    head: [["Due", "Title", "Kind"]],
    body: report.upcoming.length
      ? report.upcoming.map((u) => [new Date(u.due).toLocaleDateString(), u.title, u.kind])
      : [["—", "Nothing scheduled", ""]],
    headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    styles: { fontSize: 10, cellPadding: 6 },
    margin: { left: 40, right: 40 },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;

  // ---- Alerts
  if (y > 680) { doc.addPage(); y = 48; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Recent Alerts", 40, y);
  autoTable(doc, {
    startY: y + 8,
    head: [["Severity", "Message", "Date"]],
    body: report.alerts.length
      ? report.alerts.map((a) => [a.severity, a.message, new Date(a.date).toLocaleDateString()])
      : [["—", "No alerts", ""]],
    headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    styles: { fontSize: 10, cellPadding: 6 },
    columnStyles: { 1: { cellWidth: 320 } },
    margin: { left: 40, right: 40 },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;

  // ---- Goals
  if (y > 720) { doc.addPage(); y = 48; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Goals Progress", 40, y);
  autoTable(doc, {
    startY: y + 8,
    head: [["Goal", "Progress"]],
    body: report.goalsProgress.length
      ? report.goalsProgress.map((g) => [g.name, fmtPct(g.pct)])
      : [["No goals set", ""]],
    headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    styles: { fontSize: 10, cellPadding: 6 },
    margin: { left: 40, right: 40 },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 24;

  // ---- Insights
  if (y > 700) { doc.addPage(); y = 48; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Insights", 40, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  y += 16;
  report.insights.forEach((ins) => {
    const lines = doc.splitTextToSize(`• ${ins}`, W - 80);
    if (y + lines.length * 14 > 800) { doc.addPage(); y = 48; }
    doc.text(lines, 40, y);
    y += lines.length * 14 + 4;
  });

  // ---- Financial Advice
  if (y > 700) { doc.addPage(); y = 48; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Financial Advice", 40, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  report.advice.forEach((ins) => {
    const lines = doc.splitTextToSize(`• ${ins}`, W - 80);
    if (y + lines.length * 14 > 800) { doc.addPage(); y = 48; }
    doc.text(lines, 40, y);
    y += lines.length * 14 + 4;
  });

  // ---- Closing remark on credit
  if (y > 700) { doc.addPage(); y = 48; }
  y += 8;
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(40, y, W - 80, 70, 8, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Closing remark on credit", 56, y + 22);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const remarkLines = doc.splitTextToSize(report.creditRemark, W - 112);
  doc.text(remarkLines, 56, y + 40);
  doc.setTextColor(15, 23, 42);
  y += 84;

  // Footer with generation timestamp
  const pageCount = doc.getNumberOfPages();
  const generatedAt = new Date().toLocaleString();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`MalinGu · Generated ${generatedAt}`, 40, 820);
    doc.text(`Page ${p} / ${pageCount}`, W - 40, 820, { align: "right" });
  }

  // Save PDF to browser download (not stored on server)
  doc.save(`malingu-${report.period}-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}
