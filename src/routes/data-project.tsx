import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Database, Download, Eye, FileDown, FileSpreadsheet, Pencil, Plus, Search, Trash2, Upload } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState, SectionCard, StatusBadge, TableSkeleton } from "@/components/common";
import { FilterSelect, monthOptions, statusOptions, yearOptions } from "@/components/Filters";
import { ProjectFormDialog } from "@/components/ProjectFormDialog";
import { ExportDialog } from "@/components/ExportDialog";
import { ImportExcelDialog } from "@/components/ImportExcelDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useDeleteProject, useInvalidateAll, usePrices, useProjectTypes, useProjects, useTechnicians } from "@/lib/data";
import { filterProjects, totals, years } from "@/lib/agg";
import { formatDate, formatQty, formatRupiah } from "@/lib/format";
import { exportBackup, importBackup } from "@/lib/backup";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/data-project")({
  head: () => ({
    meta: [
      { title: "Data Project — Insentif Teknisi" },
      { name: "description", content: "Kelola data project per jenis pekerjaan beserta perhitungan insentif teknisi." },
      { property: "og:title", content: "Data Project — Insentif Teknisi" },
      { property: "og:description", content: "Kelola data project per jenis pekerjaan beserta perhitungan insentif teknisi." },
    ],
  }),
  component: DataProject,
});

const PAGE = 15;

function DataProject() {
  const { data: projects = [], isLoading, error } = useProjects();
  const { data: types = [] } = useProjectTypes();
  const { data: techs = [] } = useTechnicians();
  const { data: prices = [] } = usePrices();
  const del = useDeleteProject();
  const invalidate = useInvalidateAll();
  const [month, setMonth] = useState("ALL");
  const [year, setYear] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [tab, setTab] = useState("ALL");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [detail, setDetail] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);
  const [exportMode, setExportMode] = useState<"excel" | "pdf" | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const filtered = useMemo(() => filterProjects(projects, { month, year, status, search, typeId: tab }), [projects, month, year, status, search, tab]);
  const sections = types.filter((t) => tab === "ALL" || t.id === tab);

  const onBackupImport = async (file?: File) => {
    if (!file) return;
    try {
      const n = await importBackup(file);
      invalidate();
      toast.success(`Backup berhasil diimport (${n} baris).`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <AppShell
      title="Data Project"
      description="Project dikelompokkan per jenis pekerjaan"
      actions={
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm"><Download className="size-4" /><span className="hidden sm:inline">Export / Import</span></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setExportMode("excel")}><FileSpreadsheet className="size-4" />EXPORT EXCEL</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setExportMode("pdf")}><FileDown className="size-4" />EXPORT PDF</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setImportOpen(true)}><Upload className="size-4" />IMPORT EXCEL</DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportBackup().then(() => toast.success("Backup diunduh.")).catch((e) => toast.error(e.message))}><Database className="size-4" />Export Backup JSON</DropdownMenuItem>
              <DropdownMenuItem asChild>
                <label className="cursor-pointer"><Database className="size-4" />Import Backup JSON
                  <input type="file" accept="application/json" className="hidden" onChange={(e) => onBackupImport(e.target.files?.[0])} />
                </label>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="size-4" />Project</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex min-w-[200px] flex-1 flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Customer</span>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari customer..." className="h-9 bg-card pl-8" />
            </div>
          </div>
          <FilterSelect label="Bulan" value={month} onChange={setMonth} options={monthOptions} />
          <FilterSelect label="Tahun" value={year} onChange={setYear} options={yearOptions(years(projects))} />
          <FilterSelect label="Status" value={status} onChange={setStatus} options={statusOptions} />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {[{ id: "ALL", label: "Semua" }, ...types.map((t) => ({ id: t.id, label: t.code || t.name }))].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn("whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors", tab === t.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground")}>
              {t.label}
            </button>
          ))}
        </div>
        {error ? <EmptyState message={`Gagal memuat data: ${(error as Error).message}`} /> : isLoading ? <TableSkeleton rows={8} /> : (
          sections.map((type) => (
            <TypeSection key={type.id} title={type.name} list={filtered.filter((p) => p.project_type_id === type.id)}
              onDetail={setDetail} onEdit={(p) => { setEditing(p); setFormOpen(true); }} onDelete={setDeleting} />
          ))
        )}
      </div>

      <ProjectFormDialog open={formOpen} onOpenChange={setFormOpen} project={editing} types={types} technicians={techs} prices={prices} />
      {exportMode ? <ExportDialog open onOpenChange={(v) => !v && setExportMode(null)} mode={exportMode} projects={projects} types={types} technicians={techs} /> : null}
      <ImportExcelDialog open={importOpen} onOpenChange={setImportOpen} types={types} technicians={techs} />

      <Dialog open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Detail Project {detail?.project_number}</DialogTitle></DialogHeader>
          {detail ? (
            <div className="space-y-3 text-sm">
              <dl className="grid grid-cols-2 gap-2">
                {[["Tanggal", formatDate(detail.project_date)], ["Customer", detail.customer_name], ["Jenis", detail.project_type?.name], ["Qty", `${formatQty(detail.qty)} ${detail.unit}`], ["Harga", formatRupiah(detail.incentive_price_snapshot)], ["Total Insentif", formatRupiah(detail.total_incentive)]].map(([k, v]) => (
                  <div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>
                ))}
              </dl>
              <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">Status</span><StatusBadge status={detail.status} /></div>
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="py-1.5">Teknisi</th><th className="text-right">Qty</th><th className="text-right">Insentif</th></tr></thead>
                <tbody>{(detail.technicians ?? []).map((t) => (
                  <tr key={t.id} className="border-b last:border-0"><td className="py-1.5">{t.technician?.name}</td><td className="text-right">{formatQty(t.allocated_qty)}</td><td className="text-right font-semibold">{formatRupiah(t.incentive_amount)}</td></tr>
                ))}</tbody>
              </table>
              {detail.notes ? <p className="text-xs text-muted-foreground">Catatan: {detail.notes}</p> : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus project?</AlertDialogTitle>
            <AlertDialogDescription>Project {deleting?.customer_name} akan dihapus permanen beserta insentif teknisinya.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleting && del.mutate(deleting, { onSuccess: () => toast.success("Project dihapus."), onError: (e) => toast.error(e.message) })}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

function TypeSection({ title, list, onDetail, onEdit, onDelete }: { title: string; list: Project[]; onDetail: (p: Project) => void; onEdit: (p: Project) => void; onDelete: (p: Project) => void }) {
  const [page, setPage] = useState(0);
  const t = totals(list);
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const current = Math.min(page, pages - 1);
  const rows = list.slice(current * PAGE, current * PAGE + PAGE);
  return (
    <SectionCard
      title={title}
      right={<div className="flex flex-wrap gap-3 text-xs text-muted-foreground"><span>{t.count} project</span><span>Qty <b className="text-foreground">{formatQty(t.qty)}</b></span><span>Insentif <b className="text-foreground">{formatRupiah(t.incentive)}</b></span></div>}
    >
      {list.length === 0 ? <EmptyState message="Belum ada project pada periode ini." /> : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead><tr className="border-b text-left text-xs uppercase text-muted-foreground"><th className="py-2 pr-3">Tanggal</th><th className="pr-3">Customer</th><th className="pr-3 text-right">Qty</th><th className="pr-3">Teknisi</th><th className="pr-3 text-right">Harga</th><th className="pr-3 text-right">Total Insentif</th><th className="pr-3">Status</th><th className="text-right">Aksi</th></tr></thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="whitespace-nowrap py-2.5 pr-3">{formatDate(p.project_date)}</td>
                    <td className="pr-3 font-medium">{p.customer_name}</td>
                    <td className="pr-3 text-right">{formatQty(p.qty)}</td>
                    <td className="pr-3 text-xs">{(p.technicians ?? []).map((x) => x.technician?.name).join(", ")}</td>
                    <td className="whitespace-nowrap pr-3 text-right">{formatRupiah(p.incentive_price_snapshot)}</td>
                    <td className="whitespace-nowrap pr-3 text-right font-semibold">{formatRupiah(p.total_incentive)}</td>
                    <td className="pr-3"><StatusBadge status={p.status} /></td>
                    <td className="whitespace-nowrap text-right">
                      <Button variant="ghost" size="icon" className="size-8" onClick={() => onDetail(p)} aria-label="Detail"><Eye className="size-4" /></Button>
                      <Button variant="ghost" size="icon" className="size-8" onClick={() => onEdit(p)} aria-label="Edit"><Pencil className="size-4" /></Button>
                      <Button variant="ghost" size="icon" className="size-8 text-destructive" onClick={() => onDelete(p)} aria-label="Hapus"><Trash2 className="size-4" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pages > 1 ? (
            <div className="mt-3 flex items-center justify-end gap-2 text-xs">
              <Button variant="outline" size="sm" disabled={current === 0} onClick={() => setPage(current - 1)}>Sebelumnya</Button>
              <span>{current + 1} / {pages}</span>
              <Button variant="outline" size="sm" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>Berikutnya</Button>
            </div>
          ) : null}
        </>
      )}
    </SectionCard>
  );
}
