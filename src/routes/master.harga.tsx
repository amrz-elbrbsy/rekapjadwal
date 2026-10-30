import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { SectionCard, StatusBadge, TableSkeleton } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { activePrice, usePrices, useProjectTypes, useSavePrice } from "@/lib/data";
import { formatDate, formatRupiah } from "@/lib/format";
import type { ProjectType } from "@/lib/types";

export const Route = createFileRoute("/master/harga")({
  head: () => ({
    meta: [
      { title: "Harga Insentif — Insentif Teknisi" },
      { name: "description", content: "Atur harga insentif per jenis pekerjaan dengan tanggal berlaku." },
      { property: "og:title", content: "Harga Insentif — Insentif Teknisi" },
      { property: "og:description", content: "Atur harga insentif per jenis pekerjaan dengan tanggal berlaku." },
    ],
  }),
  component: MasterHarga,
});

function MasterHarga() {
  const { data: types = [], isLoading } = useProjectTypes();
  const { data: prices = [] } = usePrices();
  const save = useSavePrice();
  const [edit, setEdit] = useState<{ type: ProjectType; price: string; date: string } | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  const submit = () => {
    if (!edit) return;
    const price = Number(edit.price);
    if (!Number.isFinite(price) || price < 0) return toast.error("Harga tidak valid.");
    save.mutate({ project_type_id: edit.type.id, price, effective_date: edit.date }, {
      onSuccess: () => { toast.success("Harga baru disimpan."); setEdit(null); },
      onError: (e) => toast.error(e.message),
    });
  };

  return (
    <AppShell title="Harga Insentif" description="Harga baru hanya berlaku untuk project mulai tanggal berlaku; histori tidak berubah">
      <div className="space-y-4">
        <SectionCard title="Harga Aktif">
          {isLoading ? <TableSkeleton /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-xs uppercase text-muted-foreground"><th className="py-2 pr-3">Jenis Project</th><th className="pr-3 text-right">Harga Saat Ini</th><th className="w-32" /></tr></thead>
                <tbody>
                  {types.map((t) => {
                    const p = activePrice(prices, t.id, today);
                    return (
                      <tr key={t.id} className="border-b last:border-0">
                        <td className="py-2.5 pr-3 font-medium">{t.name}</td>
                        <td className="pr-3 text-right font-semibold">{p === null ? <span className="text-destructive">Belum tersedia</span> : formatRupiah(p)}</td>
                        <td className="text-right"><Button variant="outline" size="sm" onClick={() => setEdit({ type: t, price: String(p ?? ""), date: today })}><Plus className="size-4" />Ubah</Button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
        <SectionCard title="Riwayat Harga">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-xs uppercase text-muted-foreground"><th className="py-2 pr-3">Jenis</th><th className="pr-3">Berlaku</th><th className="pr-3 text-right">Harga</th><th>Status</th></tr></thead>
              <tbody>
                {prices.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-2 pr-3 text-xs">{types.find((t) => t.id === p.project_type_id)?.name}</td>
                    <td className="whitespace-nowrap pr-3">{formatDate(p.effective_date)}</td>
                    <td className="pr-3 text-right">{formatRupiah(p.price)}</td>
                    <td><StatusBadge status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
      <Dialog open={!!edit} onOpenChange={(v) => !v && setEdit(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Harga Baru</DialogTitle><DialogDescription>{edit?.type.name}</DialogDescription></DialogHeader>
          {edit ? (
            <div className="space-y-3">
              <div className="space-y-1"><Label>Harga (Rp)</Label><Input type="number" min={0} value={edit.price} onChange={(e) => setEdit({ ...edit, price: e.target.value })} /></div>
              <div className="space-y-1"><Label>Tanggal Berlaku</Label><Input type="date" value={edit.date} onChange={(e) => setEdit({ ...edit, date: e.target.value })} /></div>
            </div>
          ) : null}
          <DialogFooter><Button onClick={submit} disabled={save.isPending}>Simpan</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
