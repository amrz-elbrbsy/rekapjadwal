import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useInvalidateAll } from "@/lib/data";
import type { ProjectType, Technician } from "@/lib/types";
import { Loader2, Upload } from "lucide-react";

interface ParsedRow {
  date: string;
  customer: string;
  typeName: string;
  qty: number;
  techs: string[];
}

function excelDate(value: unknown): string | null {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "number") {
    const d = new Date(Math.round((value - 25569) * 86400 * 1000));
    return d.toISOString().slice(0, 10);
  }
  if (typeof value === "string") {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  return null;
}

export function ImportExcelDialog({
  open,
  onOpenChange,
  types,
  technicians,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  types: ProjectType[];
  technicians: Technician[];
}) {
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const invalidate = useInvalidateAll();

  async function handleFile(file: File) {
    setBusy(true);
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(await file.arrayBuffer(), { cellDates: true });
      const parsed: ParsedRow[] = [];
      for (const name of wb.SheetNames) {
        const sheet = wb.Sheets[name];
        if (!sheet) continue;
        const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true });
        let i = 0;
        while (i < grid.length) {
          const row = grid[i] ?? [];
          const headerIdx = row.findIndex((c) => String(c ?? "").trim().toUpperCase() === "TANGGAL");
          if (headerIdx >= 0) {
            const typeName = String(row[headerIdx + 3] ?? "").trim();
            const techRow = (grid[i + 2] ?? []) as unknown[];
            const techNames = techRow.slice(headerIdx + 3).map((c) => String(c ?? "").trim().toUpperCase());
            let j = i + 3;
            while (j < grid.length) {
              const r = (grid[j] ?? []) as unknown[];
              const first = String(r[headerIdx] ?? "").trim().toUpperCase();
              const cust = String(r[headerIdx + 1] ?? "").trim();
              if (first === "TANGGAL") break;
              if (cust.toUpperCase() === "TOTAL") break;
              const date = excelDate(r[headerIdx]);
              const qty = Number(r[headerIdx + 2] ?? 0);
              if (date && cust && qty > 0) {
                const techs = techNames.filter((_, k) => Number(r[headerIdx + 3 + k] ?? 0) > 0);
                if (techs.length > 0) parsed.push({ date, customer: cust, typeName, qty, techs });
              }
              j++;
            }
            i = j;
          } else i++;
        }
      }
      setRows(parsed);
      toast.success(`${parsed.length} baris siap diimport.`);
    } catch (e) {
      toast.error("Gagal membaca file: " + (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function runImport() {
    setBusy(true);
    let ok = 0;
    let failed = 0;
    try {
      for (const row of rows) {
        const type =
          types.find((t) => t.name.toUpperCase() === row.typeName.toUpperCase()) ??
          types.find((t) => row.typeName.toUpperCase().includes(t.code.replace("_", " ")));
        const techIds = row.techs
          .map((name) => technicians.find((t) => t.name.toUpperCase() === name)?.id)
          .filter((x): x is string => Boolean(x));
        if (!type || techIds.length === 0) {
          failed++;
          continue;
        }
        const { error } = await supabase.rpc("save_project", {
          p_id: null,
          p_project_date: row.date,
          p_customer_name: row.customer,
          p_project_type_id: type.id,
          p_qty: row.qty,
          p_unit: "PCS",
          p_status: "SELESAI",
          p_notes: "Import Excel",
          p_technician_ids: techIds,
        } as never);
        if (error) failed++;
        else ok++;
      }
      invalidate();
      toast.success(`${ok} project diimport${failed ? `, ${failed} baris dilewati` : ""}.`);
      setRows([]);
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Excel</DialogTitle>
          <DialogDescription>
            Ambil Tanggal, Customer, Jenis Project, Qty, dan teknisi dari workbook. Pembagian qty lama diabaikan —
            insentif dihitung ulang dengan Qty ÷ jumlah teknisi.
          </DialogDescription>
        </DialogHeader>
        <Input
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
        {rows.length > 0 ? (
          <div className="max-h-56 overflow-y-auto rounded-xl border border-border text-sm">
            {rows.slice(0, 50).map((r, i) => (
              <div key={i} className="flex justify-between gap-2 border-b border-border px-3 py-1.5 last:border-0">
                <span className="truncate">
                  {r.date} · {r.customer}
                </span>
                <span className="shrink-0 text-muted-foreground">
                  {r.qty} · {r.techs.join(", ")}
                </span>
              </div>
            ))}
          </div>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={runImport} disabled={busy || rows.length === 0}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            Import {rows.length > 0 ? `${rows.length} baris` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
