import { assignments } from "@/lib/mock-data";

export default function AsignacionesPage() {
  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.25em] text-cyan-300/80">Operación</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Asignaciones por colaborador</h1>
        <p className="mt-2 max-w-2xl text-slate-300">
          Registra entregas, devoluciones y reasignaciones con fechas y evidencia asociada.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {assignments.map((assignment) => (
          <article
            key={`${assignment.equipment}-${assignment.assignedAt}`}
            className="rounded-[24px] border border-white/10 bg-slate-950/55 p-5 backdrop-blur"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">{assignment.equipment}</h2>
                <p className="mt-1 text-sm text-slate-400">{assignment.company}</p>
              </div>
              <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                {assignment.status}
              </span>
            </div>

            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-400">Colaborador</dt>
                <dd className="mt-1 font-medium text-white">{assignment.assignedTo}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Fecha asignación</dt>
                <dd className="mt-1 font-medium text-white">{assignment.assignedAt}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Entrega</dt>
                <dd className="mt-1 font-medium text-white">{assignment.deliveredBy}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Observación</dt>
                <dd className="mt-1 font-medium text-white">{assignment.note}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}
