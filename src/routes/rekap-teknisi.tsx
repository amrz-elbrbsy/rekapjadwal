import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState, SectionCard, TableSkeleton } from "@/components/common";
import { FilterSelect, monthOptions, techOptions, typeOptions, yearOptions } from "@/components/Filters";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useProjectTypes, useProjects, useTechnicians } from "@/lib/data";
import { byTechnician, byType, completed, filterProjects, totals, years } from "@/lib/agg";
import { formatDate, formatQty, formatRupiah, num } from "@/lib/format";

export const Route = createFileRoute("/rekap-teknisi")({
  head: () => ({
    meta: [
      { title: "Rekap Teknisi — Insentif Teknisi" },
      { name: "description", content: "Rekap jumlah project, qty, dan insentif per teknisi dan per jenis project." },
      { property: "og:title", content: "Rekap Teknisi — Insentif Teknisi" },
      { property: "og:description", content: "Rekap jumlah project, qty, dan insentif per teknisi dan per jenis project." },
    ],
  }),
  component: RekapTeknisi,
});

function RekapTeknisi() {
  const { data: projects = [], isLoading } = useProjects();
  const { data: types = [] } = useProjectTypes();
  const { data: techs = [] } = useTechnicians();
  const [month, setMonth] = useState("ALL");
  const [year, setYear] = useState("ALL");
  const [typeId, setTypeId] = useState("ALL");
  const [techId, setTechId] = useState("ALL");
  const [open, setOpen] = useState<string | null>(null);

  const done = useMemo(() => completed(filterProjects(projects, { month, year, typeId, technicianId: techId })), [projects, month, year, typeId, techId]);
  const recap = byTechnician(done, techs).filter((r) => (techId === "ALL" ? r.projects > 0 : r.technician.id === techId));
  const typeRecap = byType(done, types);
  const grand = recap.reduce((a, r) => ({ p: a.p + r.projects, q: a.q + r.qty, i: a.i + r.incentive }), { p: 0, q: 0, i: 0 });
  const tt = totals(done);
  const openRow = recap.find((r) => r.technician.id === open);
  const detail = done.filter((p) => (p.technicians ?? []).some((t) => t.technician_id === open));

  return (
    <AppShell title="Rekap Teknisi" description="Hanya project berstatus SELESAI">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <FilterSelect label="Bulan" value={month} onChange={setMonth} options={monthOptions} />
          <FilterSelect label="Tahun" value={year} onChange={setYear} options={yearOptions(years(projects))} />
          <FilterSelect label="Teknisi" value={techId} onChange={setTechId} options={techOptions(techs)} />
          <FilterSelect label="Jenis Project" value={typeId} onChange={setTypeId} options={typeOptions(types)} />
        </div>
        <SectionCard title="Rekap per Teknisi" right={<span className="text-xs text-muted-foreground">Klik baris untuk detail</span>}>
          {isLoading ? <TableSkeleton /> : recap.length === 0 ? <EmptyState message="Belum ada project pada periode ini." /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-xs uppercase text-muted-foreground"><th className="py-2 pr-3">Teknisi</th><th className="pr-3 text-right">Jumlah Project</th><th className="pr-3 text-right">Total Qty</th><th className="text-right">Total Insentif</th></tr></thead>
                <tbody>
                  {recap.map((r) => (
                    <tr key={r.technician.id} onClick={() => setOpen(r.technician.id)} className="cursor-pointer border-b hover:bg-muted/40">
                      <td className="py-2.5 pr-3 font-semibold text-primary">{r.technician.name}</td>
                      <td className="pr-3 text-right">{r.projects}</td>
                      <td className="pr-3 text-right">{formatQty(r.qty)}</td>
                      <td className="text-right font-semibold">{formatRupiah(r.incentive)}</td>
                    </tr>
                  ))}
                  <tr className="bg-muted/60 font-bold"><td className="py-2.5 pr-3">TOTAL</td><td className="pr-3 text-right">{grand.p}</td><td className="pr-3 text-right">{formatQty(grand.q)}</td><td className="text-right">{formatRupiah(grand.i)}</td></tr>
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
        <SectionCard title="Rekap per Jenis Project">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-xs uppercase text-muted-foreground"><th className="py-2 pr-3">Jenis Project</th><th className="pr-3 text-right">Jumlah Project</th><th className="pr-3 text-right">Total Qty</th><th className="text-right">Total Insentif</th></tr></thead>
              <tbody>
                {typeRecap.map((r) => (
                  <tr key={r.type.id} className="border-b"><td className="py-2.5 pr-3">{r.type.name}</td><td className="pr-3 text-right">{r.count}</td><td className="pr-3 text-right">{formatQty(r.qty)}</td><td className="text-right font-semibold">{formatRupiah(r.incentive)}</td></tr>
                ))}
                <tr className="bg-muted/60 font-bold"><td className="py-2.5 pr-3">TOTAL KESELURUHAN</td><td className="pr-3 text-right">{tt.count}</td><td className="pr-3 text-right">{formatQty(tt.qty)}</td><td className="text-right">{formatRupiah(tt.incentive)}</td></tr>
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader><DialogTitle>Detail {openRow?.technician.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {types.map((type) => {
              const list = detail.filter((p) => p.project_type_id === type.id);
              if (list.length === 0) return null;
              let sq = 0, si = 0;
              return (
                <div key={type.id}>
                  <p className="mb-1 text-xs font-bold uppercase text-primary">{type.name}</p>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[680px] text-sm">
                      <thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="py-1.5 pr-2">Tanggal</th><th className="pr-2">Customer</th><th className="pr-2 text-right">Qty Project</th><th className="pr-2 text-right">Jml Teknisi</th><th className="pr-2 text-right">Qty Teknisi</th><th className="pr-2 text-right">Harga</th><th className="text-right">Insentif</th></tr></thead>
                      <tbody>
                        {list.map((p) => {
                          const pt = p.technicians!.find((t) => t.technician_id === open)!;
                          sq += num(pt.allocated_qty); si += num(pt.incentive_amount);
                          return (
                            <tr key={p.id} className="border-b">
                              <td className="whitespace-nowrap py-1.5 pr-2">{formatDate(p.project_date)}</td><td className="pr-2">{p.customer_name}</td>
                              <td className="pr-2 text-right">{formatQty(p.qty)}</td><td className="pr-2 text-right">{p.technicians!.length}</td>
                              <td className="pr-2 text-right">{formatQty(pt.allocated_qty)}</td><td className="pr-2 text-right">{formatRupiah(p.incentive_price_snapshot)}</td>
                              <td className="text-right font-semibold">{formatRupiah(pt.incentive_amount)}</td>
                            </tr>
                          );
                        })}
                        <tr className="bg-muted/50 font-semibold"><td colSpan={4} className="py-1.5">Subtotal</td><td className="pr-2 text-right">{formatQty(sq)}</td><td /><td className="text-right">{formatRupiah(si)}</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
            {openRow ? <div className="flex justify-between rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"><span>TOTAL · Qty {formatQty(openRow.qty)}</span><span>{formatRupiah(openRow.incentive)}</span></div> : null}
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
