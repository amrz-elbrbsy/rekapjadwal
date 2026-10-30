import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  FileSpreadsheet,
  FolderKanban,
  Hammer,
  LayoutDashboard,
  Menu,
  Tags,
  Users,
  Wallet,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/data-project", label: "Data Project", icon: FolderKanban },
  { to: "/rekap-teknisi", label: "Rekap Teknisi", icon: Users },
  { to: "/laporan", label: "Laporan", icon: FileSpreadsheet },
];

const MASTER = [
  { to: "/master/teknisi", label: "Teknisi", icon: Hammer },
  { to: "/master/jenis-project", label: "Jenis Project", icon: Tags },
  { to: "/master/harga", label: "Harga Insentif", icon: Wallet },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const item = (to: string, label: string, Icon: typeof Users) => {
    const active = pathname === to;
    return (
      <Link
        key={to}
        to={to}
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          active
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
        )}
      >
        <Icon className="size-4 shrink-0" />
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((n) => item(n.to, n.label, n.icon))}
      <p className="mt-5 px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/45">
        Master Data
      </p>
      {MASTER.map((n) => item(n.to, n.label, n.icon))}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3 px-3 py-1">
      <div className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
        <BarChart3 className="size-5" />
      </div>
      <div className="leading-tight">
        <p className="text-sm font-bold text-sidebar-foreground">INSENTIF TEKNISI</p>
        <p className="text-[11px] text-sidebar-foreground/55">Roller Blind Operations</p>
      </div>
    </div>
  );
}

export function AppShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col gap-6 bg-sidebar p-4 lg:flex">
        <Brand />
        <NavLinks />
        <p className="mt-auto px-3 text-[11px] text-sidebar-foreground/40">v1.0 · Data tersimpan online</p>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-border bg-card/85 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3.5 sm:px-6">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button
                  className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-foreground lg:hidden"
                  aria-label="Buka menu"
                >
                  <Menu className="size-4" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 border-0 bg-sidebar p-4">
                <div className="mt-6 flex flex-col gap-6">
                  <Brand />
                  <NavLinks onNavigate={() => setOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-semibold text-foreground sm:text-lg">{title}</h1>
              {description ? (
                <p className="truncate text-xs text-muted-foreground sm:text-sm">{description}</p>
              ) : null}
            </div>
            {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
          </div>
        </header>
        <main className="px-4 py-5 sm:px-6 sm:py-6">{children}</main>
      </div>
    </div>
  );
}
