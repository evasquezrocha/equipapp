import { maintenanceTasks } from "@/lib/mock-data";

export default function MantenimientosPage() {
  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.25em] text-cyan-300/80">Soporte</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Mantenimientos</h1>
        <p className="mt-2 max-w-2xl text-slate-300">
          Agenda correctivos y preventivos con trazabilidad de estado, prioridad y equipo.
        </p>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/55 backdrop-blur">
        <table className="min-w-full divide-y divide-white/10 text-left text-sm">
          <thead className="bg-white/5 text-slate-300">
            <tr>
              <th className="px-5 py-3 font-medium">Equipo</th>
              <th className="px-5 py-3 font-medium">Tipo</th>
              <th className="px-5 py-3 font-medium">Empresa</th>
              <th className="px-5 py-3 font-medium">Fecha</th>
              <th className="px-5 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-200">
            {maintenanceTasks.map((task) => (
              <tr key={`${task.equipment}-${task.date}`}>
                <td className="px-5 py-4 font-medium text-white">{task.equipment}</td>
                <td className="px-5 py-4">{task.type}</td>
                <td className="px-5 py-4">{task.company}</td>
                <td className="px-5 py-4">{task.date}</td>
                <td className="px-5 py-4">
                  <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-200">
                    {task.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
