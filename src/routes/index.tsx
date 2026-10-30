import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, PieChart, Pie, Legend } from "recharts";
import { CheckCircle2, FolderKanban, Package, Users, Wallet } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState, SectionCard, StatCard, StatusBadge, TableSkeleton } from "@/components/common";
import { FilterSelect, monthOptions, statusOptions, typeOptions, yearOptions } from "@/components/Filters";
import { useProjectTypes, useProjects, useTechnicians } from "@/lib/data";
import { byTechnician, byType, completed, filterProjects, monthKeys, totals, years } from "@/lib/agg";
import { formatDate, formatQty, formatRupiah, MONTHS, monthOf, yearOf } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Insentif Teknisi" },
      { name: "description", content: "Ringkasan project, qty, dan insentif teknisi pemasangan roller blind." },
      { property: "og:title", content: "Dashboard — Insentif Teknisi" },
      { property: "og:description", content: "Ringkasan project, qty, dan insentif teknisi pemasangan roller blind." },
    ],
  }),
  component: Dashboard,
});

const COLORS = ["#1e3a6e", "#2f6fd6", "#5b9bf0", "#8bb8f5", "#f59e0b", "#dc4a4a"];

function Dashboard() {
  const { data: projects = [], isLoading } = useProjects();
  const { data: types = [] } = useProjectTypes();
  const { data: techs = [] } = useTechnicians();
  const [month, setMonth] = useState("ALL");
  const [year, setYear] = useState("ALL");
  const [typeId, setTypeId] = useState("ALL");
  const [status, setStatus] = useState("ALL");

  const filtered = useMemo(() => filterProjects(projects, { month, year, typeId, status }), [projects, month, year, typeId, status]);
  const done = completed(filtered);
  const t = totals(done);

  const perMonth = monthKeys(done).map((k) => {
    const list = done.filter((p) => monthOf(p.project_date) === k.month && yearOf(p.project_date) === k.year);
    const s = totals(list);
    return { name: `${MONTHS[k.month - 1]!.slice(0, 3)} ${k.year}`, insentif: Math.round(s.incentive), qty: s.qty };
  });
  const perTech = byTechnician(done, techs).filter((r) => r.projects > 0).map((r) => ({ name: r.technician.name, insentif: Math.round(r.incentive) }));
  const perType = byType(filtered, types).filter((r) => r.count > 0).map((r) => ({ name: r.type.code || r.type.name, value: r.count }));

  return (
    <AppShell title="Dashboard" description="Ringkasan operasional & insentif teknisi">
      <div className="space-y-5">
        <div className="flex flex-wrap gap-3">
          <FilterSelect label="Bulan" value={month} onChange={setMonth} options={monthOptions} />
          <FilterSelect label="Tahun" value={year} onChange={setYear} options={yearOptions(years(projects))} />
          <FilterSelect label="Jenis Project" value={typeId} onChange={setTypeId} options={typeOptions(types)} />
          <FilterSelect label="Status" value={status} onChange={setStatus} options={statusOptions} />
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          <StatCard label="Total Project" value={String(filtered.length)} icon={<FolderKanban className="size-4" />} />
          <StatCard label="Project Selesai" value={String(done.length)} icon={<CheckCircle2 className="size-4" />} />
          <StatCard label="Total Qty" value={formatQty(t.qty)} hint="Project selesai" icon={<Package className="size-4" />} />
          <StatCard label="Total Insentif" value={formatRupiah(t.incentive)} hint="Project selesai" icon={<Wallet className="size-4" />} />
          <StatCard label="Teknisi Aktif" value={String(techs.filter((x) => x.status === "AKTIF").length)} icon={<Users className="size-4" />} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard title="Total Insentif per Bulan">
            <Chart empty={perMonth.length === 0}>
              <BarChart data={perMonth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} tickFormatter={(v) => `${v / 1000}rb`} />
                <Tooltip formatter={(v) => formatRupiah(Number(v))} />
                <Bar dataKey="insentif" fill="#2f6fd6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </Chart>
          </SectionCard>
          <SectionCard title="Insentif per Teknisi">
            <Chart empty={perTech.length === 0}>
              <BarChart data={perTech} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" fontSize={11} tickFormatter={(v) => `${v / 1000}rb`} />
                <YAxis type="category" dataKey="name" fontSize={11} width={60} />
                <Tooltip formatter={(v) => formatRupiah(Number(v))} />
                <Bar dataKey="insentif" fill="#1e3a6e" radius={[0, 6, 6, 0]} />
              </BarChart>
            </Chart>
          </SectionCard>
          <SectionCard title="Project per Jenis Pekerjaan">
            <Chart empty={perType.length === 0}>
              <PieChart>
                <Pie data={perType} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
                  {perType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </Chart>
          </SectionCard>
          <SectionCard title="Trend Total Qty">
            <Chart empty={perMonth.length === 0}>
              <LineChart data={perMonth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip formatter={(v) => formatQty(Number(v))} />
                <Line dataKey="qty" stroke="#2f6fd6" strokeWidth={2.5} dot />
              </LineChart>
            </Chart>
          </SectionCard>
        </div>
        <SectionCard title="Project Terbaru" right={<Link to="/data-project" className="text-xs font-medium text-accent">Lihat semua →</Link>}>
          {isLoading ? <TableSkeleton /> : filtered.length === 0 ? <EmptyState message="Belum ada project pada periode ini." /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-xs uppercase text-muted-foreground"><th className="py-2 pr-3">Tanggal</th><th className="pr-3">Customer</th><th className="pr-3">Jenis</th><th className="pr-3 text-right">Qty</th><th className="pr-3 text-right">Insentif</th><th>Status</th></tr></thead>
                <tbody>
                  {filtered.slice(0, 8).map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="whitespace-nowrap py-2.5 pr-3">{formatDate(p.project_date)}</td>
                      <td className="pr-3 font-medium">{p.customer_name}</td>
                      <td className="pr-3 text-xs text-muted-foreground">{p.project_type?.name}</td>
                      <td className="pr-3 text-right">{formatQty(p.qty)}</td>
                      <td className="whitespace-nowrap pr-3 text-right font-semibold">{formatRupiah(p.total_incentive)}</td>
                      <td><StatusBadge status={p.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}

function Chart({ empty, children }: { empty: boolean; children: React.ReactElement }) {
  if (empty) return <EmptyState message="Belum ada data pada periode ini." />;
  return <div className="h-64"><ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer></div>;
}
