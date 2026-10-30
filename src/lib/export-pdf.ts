import type { Project, ProjectType, Technician } from "./types";
import { MONTHS, formatDate, formatQty, formatRupiah, monthOf, yearOf } from "./format";
import { byTechnician, totals } from "./agg";

type Cell = string | number;

async function createDoc() {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  return { doc, autoTable };
}

function header(doc: any, title: string, period: string) {
  doc.setFillColor(31, 42, 68);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 64, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("INSENTIF TEKNISI", 40, 28);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Laporan Insentif Pemasangan Roller Blind", 40, 44);
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(title, 40, 92);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Periode: ${period}`, 40, 108);
}

const tableStyle = {
  styles: { fontSize: 8, cellPadding: 4 },
  headStyles: { fillColor: [31, 42, 68] as [number, number, number], textColor: 255, fontStyle: "bold" as const },
  alternateRowStyles: { fillColor: [244, 246, 250] as [number, number, number] },
  margin: { left: 40, right: 40, bottom: 40 },
  showHead: "everyPage" as const,
};

export async function exportMonthlyPdf(
  projects: Project[],
  types: ProjectType[],
  technicians: Technician[],
  period: { month: number; year: number },
) {
  const { doc, autoTable } = await createDoc();
  const label = `${MONTHS[period.month - 1]} ${period.year}`;
  const list = projects.filter(
    (p) => p.status === "SELESAI" && monthOf(p.project_date) === period.month && yearOf(p.project_date) === period.year,
  );
  header(doc, "LAPORAN BULANAN", label);

  const g = totals(list);
  autoTable(doc, {
    ...tableStyle,
    startY: 124,
    head: [["TOTAL PROJECT", "TOTAL QTY", "TOTAL INSENTIF"]],
    body: [[String(g.count), formatQty(g.qty), formatRupiah(g.incentive)]],
  });

  for (const type of types) {
    const sec = list.filter((p) => p.project_type_id === type.id);
    if (sec.length === 0) continue;
    const t = totals(sec);
    const body: Cell[][] = sec.map((p) => [
      formatDate(p.project_date),
      p.customer_name,
      formatQty(p.qty),
      (p.technicians ?? []).map((x) => x.technician?.name ?? "-").join(", "),
      formatRupiah(p.incentive_price_snapshot),
      formatRupiah(p.total_incentive),
    ]);
    body.push(["", "SUBTOTAL", formatQty(t.qty), "", "", formatRupiah(t.incentive)]);
    autoTable(doc, {
      ...tableStyle,
      startY: (doc as any).lastAutoTable.finalY + 18,
      head: [[{ content: type.name, colSpan: 6, styles: { halign: "left" as const } }], [
        "TANGGAL",
        "CUSTOMER",
        "QTY",
        "TEKNISI",
        "HARGA",
        "TOTAL",
      ]],
      body,
    });
  }

  const recap = byTechnician(list, technicians).filter((x) => x.projects > 0);
  autoTable(doc, {
    ...tableStyle,
    startY: (doc as any).lastAutoTable.finalY + 18,
    head: [[{ content: "REKAP TEKNISI", colSpan: 4, styles: { halign: "left" as const } }], [
      "TEKNISI",
      "PROJECT",
      "QTY",
      "INSENTIF",
    ]],
    body: recap.map((x) => [x.technician.name, String(x.projects), formatQty(x.qty), formatRupiah(x.incentive)]),
  });

  doc.save(`LAPORAN-${label.replace(" ", "-")}.pdf`);
}

export async function exportTechnicianPdf(
  projects: Project[],
  technicians: Technician[],
  periodLabel: string,
) {
  const { doc, autoTable } = await createDoc();
  header(doc, "REKAP INSENTIF TEKNISI", periodLabel);
  const recap = byTechnician(projects, technicians).filter((x) => x.projects > 0);
  const g = totals(projects);
  autoTable(doc, {
    ...tableStyle,
    startY: 124,
    head: [["TEKNISI", "JUMLAH PROJECT", "TOTAL QTY", "TOTAL INSENTIF"]],
    body: recap.map((x) => [x.technician.name, String(x.projects), formatQty(x.qty), formatRupiah(x.incentive)]),
    foot: [["TOTAL PROJECT SELESAI", String(g.count), formatQty(g.qty), formatRupiah(g.incentive)]],
    footStyles: { fillColor: [232, 237, 245], textColor: 20, fontStyle: "bold" },
  });
  doc.save(`REKAP-TEKNISI-${periodLabel.replace(/\s/g, "-")}.pdf`);
}

export async function exportProjectDetailPdf(projects: Project[], periodLabel: string) {
  const { doc, autoTable } = await createDoc();
  header(doc, "DETAIL PROJECT", periodLabel);
  autoTable(doc, {
    ...tableStyle,
    startY: 124,
    head: [["TANGGAL", "CUSTOMER", "JENIS", "QTY", "TEKNISI", "HARGA", "TOTAL", "STATUS"]],
    body: projects.map((p) => [
      formatDate(p.project_date),
      p.customer_name,
      p.project_type?.name ?? "-",
      formatQty(p.qty),
      (p.technicians ?? []).map((x) => x.technician?.name ?? "-").join(", "),
      formatRupiah(p.incentive_price_snapshot),
      formatRupiah(p.total_incentive),
      p.status,
    ]),
  });
  doc.save(`DETAIL-PROJECT-${periodLabel.replace(/\s/g, "-")}.pdf`);
}
