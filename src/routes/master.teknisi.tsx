import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState, SectionCard, StatusBadge, TableSkeleton } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSaveTechnician, useTechnicians } from "@/lib/data";
import type { Technician } from "@/lib/types";

export const Route = createFileRoute("/master/teknisi")({
  head: () => ({
    meta: [
      { title: "Master Teknisi — Insentif Teknisi" },
      { name: "description", content: "Tambah, edit, aktifkan, dan nonaktifkan teknisi pemasangan." },
      { property: "og:title", content: "Master Teknisi — Insentif Teknisi" },
      { property: "og:description", content: "Tambah, edit, aktifkan, dan nonaktifkan teknisi pemasangan." },
    ],
  }),
  component: MasterTeknisi,
});

function MasterTeknisi() {
  const { data = [], isLoading } = useTechnicians();
  const save = useSaveTechnician();
  const [edit, setEdit] = useState<Partial<Technician> | null>(null);

  const submit = () => {
    if (!edit?.name?.trim()) return toast.error("Nama teknisi belum diisi.");
    save.mutate({ id: edit.id, name: edit.name, status: edit.status ?? "AKTIF" }, {
      onSuccess: () => { toast.success("Teknisi disimpan."); setEdit(null); },
      onError: (e) => toast.error(e.message),
    });
  };

  return (
    <AppShell title="Master Teknisi" description="Teknisi nonaktif tidak muncul di project baru" actions={<Button size="sm" onClick={() => setEdit({ name: "", status: "AKTIF" })}><Plus className="size-4" />Teknisi</Button>}>
      <SectionCard title={`${data.length} teknisi`}>
        {isLoading ? <TableSkeleton /> : data.length === 0 ? <EmptyState message="Belum ada teknisi." /> : (
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-xs uppercase text-muted-foreground"><th className="py-2">Nama</th><th>Status</th><th className="text-right">Aktif</th><th className="w-12" /></tr></thead>
            <tbody>
              {data.map((t) => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="py-2.5 font-medium">{t.name}</td>
                  <td><StatusBadge status={t.status} /></td>
                  <td className="text-right"><Switch checked={t.status === "AKTIF"} onCheckedChange={(v) => save.mutate({ id: t.id, name: t.name, status: v ? "AKTIF" : "NONAKTIF" }, { onSuccess: () => toast.success("Status diperbarui."), onError: (e) => toast.error(e.message) })} /></td>
                  <td className="text-right"><Button variant="ghost" size="icon" className="size-8" onClick={() => setEdit(t)}><Pencil className="size-4" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionCard>
      <Dialog open={!!edit} onOpenChange={(v) => !v && setEdit(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{edit?.id ? "Edit" : "Tambah"} Teknisi</DialogTitle></DialogHeader>
          <Input autoFocus value={edit?.name ?? ""} onChange={(e) => setEdit({ ...edit, name: e.target.value })} placeholder="Nama teknisi" />
          <DialogFooter><Button onClick={submit} disabled={save.isPending}>Simpan</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
