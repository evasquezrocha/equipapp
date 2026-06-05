import { getSessionFromCookies } from "@/lib/auth";
import {
  type DashboardAssignment,
  loadDashboardSummary,
  loadRecentAssignments,
} from "@/lib/portal-data";
import {
  dashboardAlerts,
  dashboardMetrics,
  recentAssignments as mockAssignments,
  statusBreakdown,
} from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSessionFromCookies();
  const [summary, assignments] = session
    ? await Promise.all([
        loadDashboardSummary(session).catch(() => null),
        loadRecentAssignments(session).catch(() => null),
      ])
    : [null, null];

  const metrics = summary
    ? [
        { label: "Empresas activas", value: String(summary.companies), delta: "Desde SQL Server" },
        { label: "Equipos registrados", value: String(summary.equipment), delta: "Desde SQL Server" },
        { label: "Asignados", value: String(summary.assigned), delta: "Desde SQL Server" },
        {
          label: "Mantenimientos pendientes",
          value: String(summary.pendingMaintenance),
          delta: "Desde SQL Server",
        },
      ]
    : dashboardMetrics;

  const rows: ReadonlyArray<DashboardAssignment> = assignments ?? mockAssignments;

  return (
    <div className="space-y-8">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(340px,0.9fr)]">
        <div className="rounded-[28px] border border-white/10 bg-white/8 p-8 shadow-[0_30px_90px_-35px_rgba(15,23,42,0.9)] backdrop-blur-xl">
          <p className="text-sm font-medium uppercase tracking-[0.28em] text-cyan-300/90">
            Control multiempresa
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-white md:text-5xl">
            Control centralizado de equipos tecnológicos con acceso aislado por empresa.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
            Administra computadores, impresoras, celulares y tablets; asigna equipos por colaborador,
            guarda evidencias en Dropbox y mantén visibilidad total solo para el rol administrador.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="/equipos"
              className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Ver equipos
            </a>
            <a
              href="/asignaciones"
              className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-300/70 hover:bg-white/5"
            >
              Revisar asignaciones
            </a>
          </div>
        </div>

        <div className="grid gap-4">
          {metrics.map((metric) => (
            <article
              key={metric.label}
              className="rounded-[24px] border border-white/10 bg-slate-950/55 p-5 backdrop-blur"
            >
              <p className="text-sm text-slate-400">{metric.label}</p>
              <div className="mt-2 flex items-end justify-between gap-4">
                <p className="text-3xl font-semibold text-white">{metric.value}</p>
                <span className="rounded-full bg-emerald-400/12 px-3 py-1 text-xs font-semibold text-emerald-300">
                  {metric.delta}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <article className="rounded-[28px] border border-white/10 bg-slate-950/55 p-6 backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Asignaciones recientes</h2>
              <p className="mt-1 text-sm text-slate-400">
                Últimos movimientos y equipos entregados a colaboradores.
              </p>
            </div>
            <span className="rounded-full border border-cyan-300/25 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
              {rows.length} registros
            </span>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
            <table className="min-w-full divide-y divide-white/10 text-left text-sm">
              <thead className="bg-white/5 text-slate-300">
                <tr>
                  <th className="px-4 py-3 font-medium">Equipo</th>
                  <th className="px-4 py-3 font-medium">Colaborador</th>
                  <th className="px-4 py-3 font-medium">Empresa</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {rows.map((row) => (
                  <tr key={`${row.equipo}-${row.fecha}`}>
                    <td className="px-4 py-3 font-medium text-white">{row.equipo}</td>
                    <td className="px-4 py-3">{row.colaborador}</td>
                    <td className="px-4 py-3">{row.empresa}</td>
                    <td className="px-4 py-3 text-slate-400">{row.fecha}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-[28px] border border-white/10 bg-slate-950/55 p-6 backdrop-blur">
          <h2 className="text-xl font-semibold text-white">Distribución por estado</h2>
          <p className="mt-1 text-sm text-slate-400">
            Vista rápida del inventario y las condiciones de uso.
          </p>

          <div className="mt-6 space-y-4">
            {statusBreakdown.map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-slate-300">{item.label}</span>
                  <span className="font-medium text-white">{item.value}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/8">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-sky-400 to-emerald-400"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/8 p-4 text-sm text-amber-100">
            {dashboardAlerts[0]}
          </div>
        </article>
      </section>
    </div>
  );
}
