import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState, SectionCard, StatCard, TableSkeleton } from "@/components/common";
import { ExportDialog } from "@/components/ExportDialog";
import { Button } from "@/components/ui/button";
import { useProjectTypes, useProjects, useTechnicians } from "@/lib/data";
import { byTechnician, byType, completed, monthKeys, totals } from "@/lib/agg";
import { formatQty, formatRupiah, monthLabel, monthOf, yearOf } from "@/lib/format";

export const Route = createFileRoute("/laporan")({
  head: () => ({
    meta: [
      { title: "Laporan Bulanan — Insentif Teknisi" },
      { name: "description", content: "Laporan bulanan insentif per jenis pekerjaan dan per teknisi, siap export Excel & PDF." },
      { property: "og:title", content: "Laporan Bulanan — Insentif Teknisi" },
      { property: "og:description", content: "Laporan bulanan insentif per jenis pekerjaan dan per teknisi, siap export Excel & PDF." },
    ],
  }),
  component: Laporan,
});

function Laporan() {
  const { data: projects = [], isLoading } = useProjects();
  const { data: types = [] } = useProjectTypes();
  const { data: techs = [] } = useTechnicians();
  const [mode, setMode] = useState<"excel" | "pdf" | null>(null);
  const done = completed(projects);
  const periods = monthKeys(done).reverse();

  return (
    <AppShell
      title="Laporan"
      description="Laporan bulanan project SELESAI"
      actions={<>
        <Button variant="outline" size="sm" onClick={() => setMode("excel")}><FileSpreadsheet className="size-4" /><span className="hidden sm:inline">EXPORT EXCEL</span></Button>
        <Button size="sm" onClick={() => setMode("pdf")}><FileDown className="size-4" /><span className="hidden sm:inline">EXPORT PDF</span></Button>
      </>}
    >
      <div className="space-y-6">
        {isLoading ? <TableSkeleton rows={6} /> : periods.length === 0 ? <EmptyState message="Belum ada project pada periode ini." /> : periods.map((k) => {
          const list = done.filter((p) => monthOf(p.project_date) === k.month && yearOf(p.project_date) === k.year);
          const t = totals(list);
          const rt = byTechnician(list, techs).filter((r) => r.projects > 0);
          return (
            <section key={`${k.year}-${k.month}`} className="space-y-3">
              <h2 className="text-lg font-bold text-primary">{monthLabel(k.month, k.year)}</h2>
              <div className="grid grid-cols-3 gap-3">
                <StatCard label="Total Project" value={String(t.count)} />
                <StatCard label="Total Qty" value={formatQty(t.qty)} />
                <StatCard label="Total Insentif" value={formatRupiah(t.incentive)} />
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <SectionCard title="Rekap per Jenis Pekerjaan">
                  <Tbl head={["Jenis", "Project", "Qty", "Insentif"]} rows={byType(list, types).map((r) => [r.type.name, String(r.count), formatQty(r.qty), formatRupiah(r.incentive)])} total={["TOTAL", String(t.count), formatQty(t.qty), formatRupiah(t.incentive)]} />
                </SectionCard>
                <SectionCard title="Rekap per Teknisi">
                  <Tbl head={["Teknisi", "Project", "Qty", "Insentif"]} rows={rt.map((r) => [r.technician.name, String(r.projects), formatQty(r.qty), formatRupiah(r.incentive)])} total={["TOTAL", "", formatQty(rt.reduce((a, r) => a + r.qty, 0)), formatRupiah(rt.reduce((a, r) => a + r.incentive, 0))]} />
                </SectionCard>
              </div>
            </section>
          );
        })}
      </div>
      {mode ? <ExportDialog open onOpenChange={(v) => !v && setMode(null)} mode={mode} projects={projects} types={types} technicians={techs} /> : null}
    </AppShell>
  );
}

function Tbl({ head, rows, total }: { head: string[]; rows: string[][]; total: string[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b text-left text-xs uppercase text-muted-foreground">{head.map((h, i) => <th key={h} className={i ? "py-2 text-right" : "py-2 pr-3"}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => <tr key={i} className="border-b">{r.map((c, j) => <td key={j} className={j ? "py-2 text-right" : "py-2 pr-3 text-xs font-medium"}>{c}</td>)}</tr>)}
          <tr className="bg-muted/60 font-bold">{total.map((c, j) => <td key={j} className={j ? "py-2 text-right" : "py-2 pr-3"}>{c}</td>)}</tr>
        </tbody>
      </table>
    </div>
  );
}
