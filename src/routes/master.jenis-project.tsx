import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { SectionCard, StatusBadge, TableSkeleton } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useProjectTypes, useSaveProjectType } from "@/lib/data";
import type { ProjectType } from "@/lib/types";

export const Route = createFileRoute("/master/jenis-project")({
  head: () => ({
    meta: [
      { title: "Master Jenis Project — Insentif Teknisi" },
      { name: "description", content: "Kelola nama dan kode jenis pekerjaan pemasangan roller blind." },
      { property: "og:title", content: "Master Jenis Project — Insentif Teknisi" },
      { property: "og:description", content: "Kelola nama dan kode jenis pekerjaan pemasangan roller blind." },
    ],
  }),
  component: MasterJenis,
});

function MasterJenis() {
  const { data = [], isLoading } = useProjectTypes();
  const save = useSaveProjectType();
  const [edit, setEdit] = useState<ProjectType | null>(null);

  return (
    <AppShell title="Jenis Project" description="Nama jenis pekerjaan dapat diedit">
      <SectionCard title={`${data.length} jenis pekerjaan`}>
        {isLoading ? <TableSkeleton /> : (
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-xs uppercase text-muted-foreground"><th className="py-2">Kode</th><th>Nama</th><th>Status</th><th className="w-12" /></tr></thead>
            <tbody>
              {data.map((t) => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="py-2.5 text-xs font-bold text-primary">{t.code}</td>
                  <td className="font-medium">{t.name}</td>
                  <td><StatusBadge status={t.status} /></td>
                  <td className="text-right"><Button variant="ghost" size="icon" className="size-8" onClick={() => setEdit(t)}><Pencil className="size-4" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SectionCard>
      <Dialog open={!!edit} onOpenChange={(v) => !v && setEdit(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Jenis Project</DialogTitle></DialogHeader>
          {edit ? (
            <div className="space-y-3">
              <div className="space-y-1"><Label>Kode</Label><Input value={edit.code} onChange={(e) => setEdit({ ...edit, code: e.target.value.toUpperCase() })} /></div>
              <div className="space-y-1"><Label>Nama</Label><Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value.toUpperCase() })} /></div>
            </div>
          ) : null}
          <DialogFooter>
            <Button disabled={save.isPending} onClick={() => edit && (edit.name.trim() ? save.mutate(edit, { onSuccess: () => { toast.success("Jenis project disimpan."); setEdit(null); }, onError: (e) => toast.error(e.message) }) : toast.error("Nama belum diisi."))}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
