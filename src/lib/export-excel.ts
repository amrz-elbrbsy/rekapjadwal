import type { Project, ProjectType, Technician } from "./types";
import { MONTHS, monthOf, num, yearOf } from "./format";
import { byTechnician, totals } from "./agg";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const NAVY = "FF1F2A44";
const LIGHT = "FFE8EDF5";

type Row = (string | number | null)[];

export interface ExcelOptions {
  projects: Project[];
  types: ProjectType[];
  technicians: Technician[];
  periods: { month: number; year: number }[];
  includeRecap: boolean;
  filename?: string;
}

export async function exportWorkbook(opts: ExcelOptions) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "INSENTIF TEKNISI";

  const techList = opts.technicians.filter(
    (t) => t.status === "AKTIF" || opts.projects.some((p) => (p.technicians ?? []).some((x) => x.technician_id === t.id)),
  );
  const techCols = techList.length;

  for (const period of opts.periods) {
    const sheetName = `${MONTHS[period.month - 1]} ${period.year}`.slice(0, 31);
    const ws = wb.addWorksheet(sheetName);
    ws.getColumn(1).width = 14;
    ws.getColumn(2).width = 34;
    ws.getColumn(3).width = 9;
    for (let i = 0; i < techCols; i++) ws.getColumn(4 + i).width = 12;

    const monthProjects = opts.projects.filter(
      (p) =>
        p.status === "SELESAI" && monthOf(p.project_date) === period.month && yearOf(p.project_date) === period.year,
    );

    ws.mergeCells(1, 1, 1, 3 + Math.max(techCols, 1));
    const title = ws.getCell(1, 1);
    title.value = `INSENTIF PEMASANGAN — ${sheetName}`;
    title.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
    title.alignment = { horizontal: "center", vertical: "middle" };
    title.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
    ws.getRow(1).height = 24;

    let r = 3;

    for (const type of opts.types) {
      const list = monthProjects.filter((p) => p.project_type_id === type.id);
      const price = list[0]?.incentive_price_snapshot ?? 0;

      const headerRow = ws.getRow(r);
      headerRow.getCell(1).value = "TANGGAL";
      headerRow.getCell(2).value = "CUSTOMER";
      headerRow.getCell(3).value = "QTY";
      headerRow.getCell(4).value = type.name;
      if (techCols > 1) ws.mergeCells(r, 4, r, 3 + techCols);
      for (let c = 1; c <= 3 + techCols; c++) {
        const cell = headerRow.getCell(c);
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
        cell.alignment = { horizontal: "center" };
        cell.border = { bottom: { style: "thin" } };
      }
      r++;

      const priceRow = ws.getRow(r);
      priceRow.getCell(3).value = "HARGA";
      priceRow.getCell(4).value = num(price);
      priceRow.getCell(4).numFmt = '"Rp"#,##0';
      priceRow.getCell(3).font = { bold: true };
      priceRow.getCell(4).font = { bold: true };
      r++;

      const techRow = ws.getRow(r);
      techList.forEach((t, i) => {
        const cell = techRow.getCell(4 + i);
        cell.value = t.name;
        cell.font = { bold: true };
        cell.alignment = { horizontal: "center" };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: LIGHT } };
      });
      r++;

      const perTechQty = new Array(techCols).fill(0) as number[];
      for (const p of list) {
        const row = ws.getRow(r);
        row.getCell(1).value = new Date(p.project_date + "T00:00:00");
        row.getCell(1).numFmt = "dd/mm/yyyy";
        row.getCell(2).value = p.customer_name;
        row.getCell(3).value = num(p.qty);
        row.getCell(3).numFmt = "#,##0.####";
        for (const pt of p.technicians ?? []) {
          const idx = techList.findIndex((t) => t.id === pt.technician_id);
          if (idx >= 0) {
            row.getCell(4 + idx).value = num(pt.allocated_qty);
            row.getCell(4 + idx).numFmt = "#,##0.####";
            perTechQty[idx] = (perTechQty[idx] ?? 0) + num(pt.allocated_qty);
          }
        }
        r++;
      }

      if (list.length === 0) {
        ws.getRow(r).getCell(2).value = "Belum ada project pada periode ini.";
        ws.getRow(r).getCell(2).font = { italic: true, color: { argb: "FF888888" } };
        r++;
      }

      const sub = totals(list);
      const qtyRow = ws.getRow(r);
      qtyRow.getCell(2).value = "SUBTOTAL QTY";
      qtyRow.getCell(3).value = sub.qty;
      qtyRow.getCell(3).numFmt = "#,##0.####";
      perTechQty.forEach((v, i) => {
        qtyRow.getCell(4 + i).value = v;
        qtyRow.getCell(4 + i).numFmt = "#,##0.####";
      });
      qtyRow.font = { bold: true };
      r++;

      const totalRow = ws.getRow(r);
      totalRow.getCell(2).value = "TOTAL";
      totalRow.getCell(3).value = sub.incentive;
      totalRow.getCell(3).numFmt = '"Rp"#,##0';
      perTechQty.forEach((v, i) => {
        totalRow.getCell(4 + i).value = Math.round(v * num(price));
        totalRow.getCell(4 + i).numFmt = '"Rp"#,##0';
      });
      totalRow.font = { bold: true };
      totalRow.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: LIGHT } };
      });
      r += 2;
    }

    const grand = totals(monthProjects);
    const gRow = ws.getRow(r);
    gRow.getCell(2).value = "TOTAL KESELURUHAN";
    gRow.getCell(3).value = grand.incentive;
    gRow.getCell(3).numFmt = '"Rp"#,##0';
    gRow.font = { bold: true, size: 12 };
    r += 2;

    const recap = byTechnician(monthProjects, opts.technicians).filter((x) => x.projects > 0);
    ws.getRow(r).getCell(1).value = "REKAP TEKNISI";
    ws.getRow(r).getCell(1).font = { bold: true };
    r++;
    const rh = ws.getRow(r);
    (["TEKNISI", "QTY", "GRAND TOTAL"] as Row).forEach((v, i) => {
      const cell = rh.getCell(1 + i);
      cell.value = v as string;
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
    });
    r++;
    for (const item of recap) {
      const row = ws.getRow(r);
      row.getCell(1).value = item.technician.name;
      row.getCell(2).value = item.qty;
      row.getCell(2).numFmt = "#,##0.####";
      row.getCell(3).value = item.incentive;
      row.getCell(3).numFmt = '"Rp"#,##0';
      r++;
    }
  }

  if (opts.includeRecap) {
    const ws = wb.addWorksheet("REKAP");
    ws.getColumn(1).width = 20;
    ws.getColumn(2).width = 14;
    ws.getColumn(3).width = 18;
    const done = opts.projects.filter((p) => p.status === "SELESAI");

    ws.getCell(1, 1).value = "REKAP TEKNISI (SEMUA PERIODE)";
    ws.getCell(1, 1).font = { bold: true, size: 12 };
    let r = 3;
    ["TEKNISI", "QTY", "GRAND TOTAL"].forEach((v, i) => {
      const cell = ws.getRow(r).getCell(1 + i);
      cell.value = v;
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
    });
    r++;
    for (const item of byTechnician(done, opts.technicians)) {
      const row = ws.getRow(r);
      row.getCell(1).value = item.technician.name;
      row.getCell(2).value = item.qty;
      row.getCell(2).numFmt = "#,##0.####";
      row.getCell(3).value = item.incentive;
      row.getCell(3).numFmt = '"Rp"#,##0';
      r++;
    }

    r += 2;
    ws.getRow(r).getCell(1).value = "REKAP PER JENIS PROJECT";
    ws.getRow(r).getCell(1).font = { bold: true, size: 12 };
    r += 1;
    ["JENIS PROJECT", "JUMLAH", "QTY", "TOTAL INSENTIF"].forEach((v, i) => {
      const cell = ws.getRow(r).getCell(1 + i);
      cell.value = v;
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
    });
    ws.getColumn(4).width = 18;
    r++;
    for (const type of opts.types) {
      const t = totals(done.filter((p) => p.project_type_id === type.id));
      const row = ws.getRow(r);
      row.getCell(1).value = type.name;
      row.getCell(2).value = t.count;
      row.getCell(3).value = t.qty;
      row.getCell(3).numFmt = "#,##0.####";
      row.getCell(4).value = t.incentive;
      row.getCell(4).numFmt = '"Rp"#,##0';
      r++;
    }
    const g = totals(done);
    const grandRow = ws.getRow(r);
    grandRow.getCell(1).value = "TOTAL";
    grandRow.getCell(2).value = g.count;
    grandRow.getCell(3).value = g.qty;
    grandRow.getCell(3).numFmt = "#,##0.####";
    grandRow.getCell(4).value = g.incentive;
    grandRow.getCell(4).numFmt = '"Rp"#,##0';
    grandRow.font = { bold: true };
  }

  const buffer = await wb.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    opts.filename ?? "INSENTIF-TEKNISI.xlsx",
  );
}
