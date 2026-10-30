import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { IncentivePrice, Project, ProjectType, Technician } from "./types";
import { num } from "./format";

const PROJECT_SELECT =
  "*, project_type:project_types(*), technicians:project_technicians(*, technician:technicians(id,name))";

async function logAudit(action: string, entity: string, entityId: string | null, newValue: unknown) {
  await supabase.from("audit_logs").insert({
    action,
    entity,
    entity_id: entityId,
    new_value: (newValue ?? null) as never,
  } as never);
}

export function useTechnicians() {
  return useQuery({
    queryKey: ["technicians"],
    queryFn: async (): Promise<Technician[]> => {
      const { data, error } = await supabase.from("technicians").select("*").order("name");
      if (error) throw error;
      return (data ?? []) as unknown as Technician[];
    },
  });
}

export function useProjectTypes() {
  return useQuery({
    queryKey: ["project_types"],
    queryFn: async (): Promise<ProjectType[]> => {
      const { data, error } = await supabase.from("project_types").select("*").order("sort_order");
      if (error) throw error;
      return (data ?? []) as unknown as ProjectType[];
    },
  });
}

export function usePrices() {
  return useQuery({
    queryKey: ["incentive_prices"],
    queryFn: async (): Promise<IncentivePrice[]> => {
      const { data, error } = await supabase
        .from("incentive_prices")
        .select("*")
        .order("effective_date", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as unknown as IncentivePrice[]).map((p) => ({ ...p, price: num(p.price) }));
    },
  });
}

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async (): Promise<Project[]> => {
      const { data, error } = await supabase
        .from("projects")
        .select(PROJECT_SELECT)
        .order("project_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as unknown as Project[]).map((p) => ({
        ...p,
        qty: num(p.qty),
        incentive_price_snapshot: num(p.incentive_price_snapshot),
        total_incentive: num(p.total_incentive),
        technicians: (p.technicians ?? []).map((t) => ({
          ...t,
          allocated_qty: num(t.allocated_qty),
          incentive_amount: num(t.incentive_amount),
        })),
      }));
    },
  });
}

export function useInvalidateAll() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: ["projects"] });
    void qc.invalidateQueries({ queryKey: ["technicians"] });
    void qc.invalidateQueries({ queryKey: ["project_types"] });
    void qc.invalidateQueries({ queryKey: ["incentive_prices"] });
  };
}

export interface SaveProjectInput {
  id?: string | null;
  project_date: string;
  customer_name: string;
  project_type_id: string;
  qty: number;
  unit: string;
  status: string;
  notes: string;
  technician_ids: string[];
}

export function validateProject(input: Partial<SaveProjectInput>, price: number | null): string | null {
  if (!input.project_date) return "Tanggal belum diisi.";
  if (!input.customer_name?.trim()) return "Customer belum diisi.";
  if (!input.project_type_id) return "Jenis project belum dipilih.";
  if (!input.qty || input.qty <= 0) return "Qty harus lebih dari 0.";
  const ids = input.technician_ids ?? [];
  if (ids.length === 0) return "Teknisi belum dipilih.";
  if (new Set(ids).size !== ids.length) return "Teknisi sudah dipilih.";
  if (price === null || price === undefined) return "Harga insentif belum tersedia.";
  return null;
}

export function useSaveProject() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: async (input: SaveProjectInput) => {
      const { data, error } = await supabase.rpc("save_project", {
        p_id: input.id ?? null,
        p_project_date: input.project_date,
        p_customer_name: input.customer_name.trim(),
        p_project_type_id: input.project_type_id,
        p_qty: input.qty,
        p_unit: input.unit || "PCS",
        p_status: input.status,
        p_notes: input.notes || null,
        p_technician_ids: Array.from(new Set(input.technician_ids)),
      } as never);
      if (error) throw new Error(error.message);
      return data as unknown as string;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteProject() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: async (project: Project) => {
      const { error } = await supabase.from("projects").delete().eq("id", project.id);
      if (error) throw new Error(error.message);
      await logAudit("DELETE PROJECT", "projects", project.id, {
        customer: project.customer_name,
        total: project.total_incentive,
      });
    },
    onSuccess: invalidate,
  });
}

export function useSaveTechnician() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: async (input: { id?: string; name: string; status: string }) => {
      if (input.id) {
        const { error } = await supabase
          .from("technicians")
          .update({ name: input.name.trim().toUpperCase(), status: input.status } as never)
          .eq("id", input.id);
        if (error) throw new Error(error.message);
        await logAudit("UPDATE TECHNICIAN", "technicians", input.id, input);
      } else {
        const { data, error } = await supabase
          .from("technicians")
          .insert({ name: input.name.trim().toUpperCase(), status: input.status } as never)
          .select("id")
          .single();
        if (error) throw new Error(error.message);
        await logAudit("CREATE TECHNICIAN", "technicians", (data as { id: string }).id, input);
      }
    },
    onSuccess: invalidate,
  });
}

export function useSaveProjectType() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: async (input: { id?: string; name: string; code: string; status: string; sort_order: number }) => {
      if (input.id) {
        const { error } = await supabase
          .from("project_types")
          .update({ name: input.name, code: input.code, status: input.status } as never)
          .eq("id", input.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from("project_types").insert(input as never);
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: invalidate,
  });
}

export function useSavePrice() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: async (input: { id?: string; project_type_id: string; price: number; effective_date: string }) => {
      if (input.id) {
        const { error } = await supabase
          .from("incentive_prices")
          .update({ price: input.price, effective_date: input.effective_date } as never)
          .eq("id", input.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from("incentive_prices").insert({ ...input, status: "AKTIF" } as never);
        if (error) throw new Error(error.message);
      }
      await logAudit("UPDATE PRICE", "incentive_prices", input.id ?? null, input);
    },
    onSuccess: invalidate,
  });
}

export function activePrice(prices: IncentivePrice[], typeId: string, date?: string): number | null {
  const list = prices
    .filter((p) => p.project_type_id === typeId && p.status === "AKTIF")
    .sort((a, b) => (a.effective_date < b.effective_date ? 1 : -1));
  if (list.length === 0) return null;
  if (date) {
    const match = list.find((p) => p.effective_date <= date);
    if (match) return num(match.price);
  }
  return num(list[0]!.price);
}
