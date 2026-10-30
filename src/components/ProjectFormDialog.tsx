import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { activePrice, useSaveProject, validateProject } from "@/lib/data";
import type { IncentivePrice, Project, ProjectType, Technician } from "@/lib/types";
import { formatQty, formatRupiah } from "@/lib/format";
import { Calculator, Loader2 } from "lucide-react";

const today = () => new Date().toISOString().slice(0, 10);

export function ProjectFormDialog({
  open,
  onOpenChange,
  project,
  types,
  technicians,
  prices,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null;
  types: ProjectType[];
  technicians: Technician[];
  prices: IncentivePrice[];
}) {
  const save = useSaveProject();
  const [date, setDate] = useState(today());
  const [customer, setCustomer] = useState("");
  const [typeId, setTypeId] = useState("");
  const [qty, setQty] = useState("");
  const [unit, setUnit] = useState("PCS");
  const [status, setStatus] = useState("SELESAI");
  const [notes, setNotes] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    if (project) {
      setDate(project.project_date);
      setCustomer(project.customer_name);
      setTypeId(project.project_type_id);
      setQty(String(project.qty));
      setUnit(project.unit);
      setStatus(project.status);
      setNotes(project.notes ?? "");
      setSelected((project.technicians ?? []).map((t) => t.technician_id));
    } else {
      setDate(today());
      setCustomer("");
      setTypeId(types[0]?.id ?? "");
      setQty("");
      setUnit("PCS");
      setStatus("SELESAI");
      setNotes("");
      setSelected([]);
    }
  }, [open, project, types]);

  const availableTechs = useMemo(
    () => technicians.filter((t) => t.status === "AKTIF" || selected.includes(t.id)),
    [technicians, selected],
  );

  const price = typeId ? activePrice(prices, typeId, date) : null;
  const qtyNum = Number(qty.replace(",", ".")) || 0;
  const count = selected.length;
  const total = qtyNum > 0 && price ? qtyNum * price : 0;
  const perQty = count > 0 && qtyNum > 0 ? qtyNum / count : 0;
  const perAmount = price ? perQty * price : 0;

  function toggle(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return [...prev, id];
    });
  }

  async function handleSubmit() {
    const input = {
      id: project?.id ?? null,
      project_date: date,
      customer_name: customer,
      project_type_id: typeId,
      qty: qtyNum,
      unit,
      status,
      notes,
      technician_ids: selected,
    };
    const error = validateProject(input, price);
    if (error) {
      toast.error(error);
      return;
    }
    try {
      await save.mutateAsync(input);
      toast.success(project ? "Project berhasil diperbarui." : "Project berhasil disimpan.");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{project ? "Edit Project" : "Tambah Project"}</DialogTitle>
          <DialogDescription>
            Insentif dihitung otomatis: total project = Qty × Harga, insentif teknisi = (Qty ÷ jumlah teknisi) × Harga.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="tanggal">Tanggal</Label>
            <Input id="tanggal" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer">Customer</Label>
            <Input
              id="customer"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              placeholder="Nama customer / lokasi"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Jenis Project</Label>
            <Select value={typeId} onValueChange={setTypeId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis project" />
              </SelectTrigger>
              <SelectContent>
                {types
                  .filter((t) => t.status === "AKTIF" || t.id === typeId)
                  .map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="qty">Qty</Label>
            <Input id="qty" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="0" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="satuan">Satuan</Label>
            <Input id="satuan" value={unit} onChange={(e) => setUnit(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">DRAFT</SelectItem>
                <SelectItem value="SELESAI">SELESAI</SelectItem>
                <SelectItem value="DIBATALKAN">DIBATALKAN</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Harga Insentif</Label>
            <Input value={price === null ? "Belum tersedia" : formatRupiah(price)} readOnly className="bg-muted" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Teknisi</Label>
            <div className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto rounded-xl border border-border p-3 sm:grid-cols-3">
              {availableTechs.map((t) => (
                <label
                  key={t.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted"
                >
                  <Checkbox checked={selected.includes(t.id)} onCheckedChange={() => toggle(t.id)} />
                  <span>{t.name}</span>
                </label>
              ))}
              {availableTechs.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada teknisi aktif.</p>
              ) : null}
            </div>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="catatan">Catatan</Label>
            <Textarea id="catatan" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-muted/40 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Calculator className="size-4 text-accent" /> PERHITUNGAN INSENTIF
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <Info label="Qty" value={formatQty(qtyNum)} />
            <Info label="Jumlah Teknisi" value={String(count)} />
            <Info label="Harga" value={price === null ? "-" : formatRupiah(price)} />
            <Info label="Total Project" value={formatRupiah(total)} />
            <Info label="Per Teknisi" value={formatRupiah(perAmount)} />
            <Info label="Qty per Teknisi" value={formatQty(perQty)} />
          </div>
          {count > 0 && qtyNum > 0 ? (
            <div className="mt-4 space-y-1.5 border-t border-border pt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Breakdown</p>
              {selected.map((id) => {
                const tech = technicians.find((t) => t.id === id);
                return (
                  <div key={id} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{tech?.name ?? "-"}</span>
                    <span className="text-muted-foreground">
                      {formatQty(perQty)} Qty · {formatRupiah(perAmount)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={save.isPending}>
            {save.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Simpan Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
