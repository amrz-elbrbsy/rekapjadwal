export const MONTHS = [
  "JANUARI",
  "FEBRUARI",
  "MARET",
  "APRIL",
  "MEI",
  "JUNI",
  "JULI",
  "AGUSTUS",
  "SEPTEMBER",
  "OKTOBER",
  "NOVEMBER",
  "DESEMBER",
];

export function formatRupiah(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  return "Rp" + new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(Math.round(n));
}

export function formatQty(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  const rounded = Math.round(n * 10000) / 10000;
  if (Number.isInteger(rounded)) return new Intl.NumberFormat("id-ID").format(rounded);
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(rounded);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  const d = new Date(value + "T00:00:00");
  if (Number.isNaN(d.getTime())) return String(value);
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(d);
}

export function monthLabel(month: number, year: number): string {
  return `${MONTHS[month - 1]} ${year}`;
}

export function monthOf(dateStr: string): number {
  return Number(dateStr.slice(5, 7));
}

export function yearOf(dateStr: string): number {
  return Number(dateStr.slice(0, 4));
}

export function num(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}
