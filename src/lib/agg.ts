import type { Project, ProjectType, Technician } from "./types";
import { monthOf, num, yearOf } from "./format";

export interface Filters {
  month: string; // "ALL" | "1".."12"
  year: string; // "ALL" | "2026"
  typeId: string; // "ALL" | uuid
  status: string; // "ALL" | DRAFT | SELESAI | DIBATALKAN
  search?: string;
  technicianId?: string;
}

export const ALL = "ALL";

export function filterProjects(projects: Project[], f: Partial<Filters>): Project[] {
  return projects.filter((p) => {
    if (f.month && f.month !== ALL && monthOf(p.project_date) !== Number(f.month)) return false;
    if (f.year && f.year !== ALL && yearOf(p.project_date) !== Number(f.year)) return false;
    if (f.typeId && f.typeId !== ALL && p.project_type_id !== f.typeId) return false;
    if (f.status && f.status !== ALL && p.status !== f.status) return false;
    if (f.search && !p.customer_name.toLowerCase().includes(f.search.toLowerCase())) return false;
    if (
      f.technicianId &&
      f.technicianId !== ALL &&
      !(p.technicians ?? []).some((t) => t.technician_id === f.technicianId)
    )
      return false;
    return true;
  });
}

export function completed(projects: Project[]): Project[] {
  return projects.filter((p) => p.status === "SELESAI");
}

export interface Totals {
  count: number;
  qty: number;
  incentive: number;
}

export function totals(projects: Project[]): Totals {
  return projects.reduce<Totals>(
    (acc, p) => ({
      count: acc.count + 1,
      qty: acc.qty + num(p.qty),
      incentive: acc.incentive + num(p.total_incentive),
    }),
    { count: 0, qty: 0, incentive: 0 },
  );
}

export function byType(projects: Project[], types: ProjectType[]) {
  return types.map((t) => {
    const list = projects.filter((p) => p.project_type_id === t.id);
    return { type: t, projects: list, ...totals(list) };
  });
}

export interface TechnicianRecap {
  technician: { id: string; name: string };
  projects: number;
  qty: number;
  incentive: number;
}

export function byTechnician(projects: Project[], technicians: Technician[]): TechnicianRecap[] {
  const map = new Map<string, TechnicianRecap>();
  for (const t of technicians) {
    map.set(t.id, { technician: { id: t.id, name: t.name }, projects: 0, qty: 0, incentive: 0 });
  }
  for (const p of projects) {
    for (const pt of p.technicians ?? []) {
      const name = pt.technician?.name ?? "-";
      const current = map.get(pt.technician_id) ?? {
        technician: { id: pt.technician_id, name },
        projects: 0,
        qty: 0,
        incentive: 0,
      };
      current.projects += 1;
      current.qty += num(pt.allocated_qty);
      current.incentive += num(pt.incentive_amount);
      map.set(pt.technician_id, current);
    }
  }
  return Array.from(map.values()).sort((a, b) => b.incentive - a.incentive);
}

export function monthKeys(projects: Project[]): { month: number; year: number }[] {
  const set = new Set<string>();
  for (const p of projects) set.add(`${yearOf(p.project_date)}-${monthOf(p.project_date)}`);
  return Array.from(set)
    .map((k) => {
      const [year, month] = k.split("-");
      return { year: Number(year), month: Number(month) };
    })
    .sort((a, b) => a.year - b.year || a.month - b.month);
}

export function years(projects: Project[]): number[] {
  const set = new Set<number>(projects.map((p) => yearOf(p.project_date)));
  if (set.size === 0) set.add(new Date().getFullYear());
  return Array.from(set).sort((a, b) => b - a);
}
