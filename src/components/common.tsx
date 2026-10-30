import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Inbox } from "lucide-react";

export function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <Card className="gap-0 rounded-xl border-border p-4 shadow-none">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        {icon ? <span className="text-accent">{icon}</span> : null}
      </div>
      <p className="mt-2 text-xl font-bold text-foreground sm:text-2xl">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </Card>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    SELESAI: "bg-success/12 text-success border-success/30",
    DRAFT: "bg-warning/15 text-warning-foreground border-warning/40",
    DIBATALKAN: "bg-destructive/10 text-destructive border-destructive/30",
    AKTIF: "bg-success/12 text-success border-success/30",
    NONAKTIF: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold",
        map[status] ?? "bg-muted text-muted-foreground border-border",
      )}
    >
      {status}
    </span>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 px-6 py-10 text-center">
      <Inbox className="size-6 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full rounded-lg" />
      ))}
    </div>
  );
}

export function SectionCard({
  title,
  right,
  children,
  className,
}: {
  title: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("gap-0 rounded-xl border-border p-0 shadow-none", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="text-sm font-semibold text-foreground">{title}</div>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </Card>
  );
}
