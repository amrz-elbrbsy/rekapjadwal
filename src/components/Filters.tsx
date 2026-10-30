import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MONTHS } from "@/lib/format";
import type { ProjectType, Technician } from "@/lib/types";

export function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex min-w-[140px] flex-1 flex-col gap-1 sm:flex-none">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 bg-card">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export const monthOptions = [
  { value: "ALL", label: "Semua Bulan" },
  ...MONTHS.map((m, i) => ({ value: String(i + 1), label: m })),
];
export const yearOptions = (ys: number[]) => [
  { value: "ALL", label: "Semua Tahun" },
  ...ys.map((y) => ({ value: String(y), label: String(y) })),
];
export const typeOptions = (types: ProjectType[]) => [
  { value: "ALL", label: "Semua Jenis" },
  ...types.map((t) => ({ value: t.id, label: t.name })),
];
export const statusOptions = [
  { value: "ALL", label: "Semua Status" },
  { value: "SELESAI", label: "SELESAI" },
  { value: "DRAFT", label: "DRAFT" },
  { value: "DIBATALKAN", label: "DIBATALKAN" },
];
export const techOptions = (techs: Technician[]) => [
  { value: "ALL", label: "Semua Teknisi" },
  ...techs.map((t) => ({ value: t.id, label: t.name })),
];
