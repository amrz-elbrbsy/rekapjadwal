import { supabase } from "@/integrations/supabase/client";

const TABLES = ["technicians", "project_types", "incentive_prices", "projects", "project_technicians"] as const;

export async function exportBackup() {
  const payload: Record<string, unknown[]> = {};
  for (const table of TABLES) {
    const { data, error } = await supabase.from(table).select("*");
    if (error) throw new Error(error.message);
    payload[table] = data ?? [];
  }
  const blob = new Blob([JSON.stringify({ exported_at: new Date().toISOString(), data: payload }, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `BACKUP-INSENTIF-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importBackup(file: File) {
  const text = await file.text();
  const parsed = JSON.parse(text) as { data?: Record<string, unknown[]> };
  const data = parsed.data ?? (parsed as unknown as Record<string, unknown[]>);
  let inserted = 0;
  for (const table of TABLES) {
    const rows = data[table];
    if (!Array.isArray(rows) || rows.length === 0) continue;
    const { error } = await supabase.from(table).upsert(rows as never, { onConflict: "id" });
    if (error) throw new Error(`${table}: ${error.message}`);
    inserted += rows.length;
  }
  return inserted;
}
