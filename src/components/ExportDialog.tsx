import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { exportWorkbook } from "@/lib/export-excel";
import { exportMonthlyPdf, exportProjectDetailPdf, exportTechnicianPdf } from "@/lib/export-pdf";
import { monthKeys } from "@/lib/agg";
import { MONTHS, monthLabel } from "@/lib/format";
import type { Project, ProjectType, Technician } from "@/lib/types";
import { FileDown, Loader2 } from "lucide-react";

export function ExportDialog({
  open,
  onOpenChange,
  mode,
  projects,
  types,
  technicians,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: "excel" | "pdf";
  projects: Project[];
  types: ProjectType[];
  technicians: Technician[];
}) {
  const periods = monthKeys(projects);
  const [period, setPeriod] = useState("ALL");
  const [content, setContent] = useState(mode === "excel" ? "PROJECT" : "BULANAN");
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      const selectedPeriods =
        period === "ALL" ? periods : periods.filter((p) => `${p.year}-${p.month}` === period);
      if (selectedPeriods.length === 0) {
        toast.error("Belum ada data pada periode ini.");
        return;
      }
      const label = period === "ALL" ? "SEMUA PERIODE" : monthLabel(selectedPeriods[0]!.month, selectedPeriods[0]!.year);

      if (mode === "excel") {
        await exportWorkbook({
          projects,
          types,
          technicians,
          periods: selectedPeriods,
          includeRecap: content !== "PROJECT",
          filename: `INSENTIF-${label.replace(/\s/g, "-")}.xlsx`,
        });
      } else if (content === "BULANAN") {
        for (const p of selectedPeriods) await exportMonthlyPdf(projects, types, technicians, p);
      } else if (content === "REKAP") {
        const filtered = projects.filter(
          (p) =>
            p.status === "SELESAI" &&
            selectedPeriods.some(
              (s) => Number(p.project_date.slice(5, 7)) === s.month && Number(p.project_date.slice(0, 4)) === s.year,
            ),
        );
        await exportTechnicianPdf(filtered, technicians, label);
      } else {
        const filtered = projects.filter((p) =>
          selectedPeriods.some(
            (s) => Number(p.project_date.slice(5, 7)) === s.month && Number(p.project_date.slice(0, 4)) === s.year,
          ),
        );
        await exportProjectDetailPdf(filtered, label);
      }
      toast.success("File berhasil dibuat.");
      onOpenChange(false);
    } catch (e) {
      toast.error("Gagal membuat file: " + (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "excel" ? "Export Excel" : "Export PDF"}</DialogTitle>
          <DialogDescription>
            {mode === "excel"
              ? "Format mengikuti workbook insentif: satu sheet per bulan, dipisah per jenis pekerjaan."
              : "Laporan A4 dengan header berulang di setiap halaman."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Periode</Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua bulan</SelectItem>
                {periods.map((p) => (
                  <SelectItem key={`${p.year}-${p.month}`} value={`${p.year}-${p.month}`}>
                    {MONTHS[p.month - 1]} {p.year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Isi laporan</Label>
            <Select value={content} onValueChange={setContent}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {mode === "excel" ? (
                  <>
                    <SelectItem value="PROJECT">Rekap project (per bulan)</SelectItem>
                    <SelectItem value="FULL">Rekap project + sheet REKAP teknisi</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="BULANAN">PDF Bulanan</SelectItem>
                    <SelectItem value="REKAP">PDF Rekap Teknisi</SelectItem>
                    <SelectItem value="DETAIL">PDF Detail Project</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={run} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <FileDown className="size-4" />}
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
