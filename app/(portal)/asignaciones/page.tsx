import Link from "next/link";
import { getSessionFromCookies } from "@/lib/auth";
import { getCollaboratorById, listEquipment } from "@/lib/catalog-data";
import { loadAssignments, type AssignmentRow } from "@/lib/portal-data";
import type { EquipmentCrudRow } from "@/lib/catalog-types";
import { AssignedEquipmentTable } from "@/components/assigned-equipment-table";

export const dynamic = "force-dynamic";

type AsignacionesPageProps = {
  searchParams?: {
    colaboradorId?: string | string[];
  };
};

function readSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AsignacionesPage({ searchParams }: AsignacionesPageProps) {
  const session = await getSessionFromCookies();
  if (!session) {
    return null;
  }

  const collaboratorIdRaw = readSingleValue(searchParams?.colaboradorId);
  const collaboratorId = collaboratorIdRaw ? Number(collaboratorIdRaw) : null;
  const selectedCollaboratorId =
    Number.isInteger(collaboratorId) && collaboratorId && collaboratorId > 0 ? collaboratorId : null;

  const [assignments, collaborator, equipmentRows] = await Promise.all([
    loadAssignments(session, selectedCollaboratorId).catch(() => [] as AssignmentRow[]),
    selectedCollaboratorId ? getCollaboratorById(session, selectedCollaboratorId).catch(() => null) : Promise.resolve(null),
    listEquipment(session).catch(() => [] as EquipmentCrudRow[]),
  ]);

  const assignedEquipment = equipmentRows.filter((row) =>
    selectedCollaboratorId ? row.collaboratorId === selectedCollaboratorId : Boolean(row.collaboratorId),
  );

  const latestAssignment = assignments[0] ?? null;

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.25em] text-cyan-300/80">Operación</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Asignaciones por colaborador</h1>
        <p className="mt-2 max-w-2xl text-slate-300">
          Registra entregas, devoluciones y reasignaciones con fechas y evidencia asociada.
        </p>
      </div>

      {collaborator ? (
        <div className="flex flex-wrap items-center gap-3 rounded-[24px] border border-cyan-300/20 bg-cyan-400/10 px-5 py-4 text-sm text-cyan-100">
          <span className="font-medium">Colaborador:</span>
          <span>{collaborator.fullName}</span>
          <span className="text-cyan-200/70">{collaborator.companyName}</span>
          {latestAssignment ? (
            <span className="rounded-full border border-cyan-200/25 px-3 py-1 text-xs font-semibold text-cyan-50">
              Última asignación: {latestAssignment.assignedAt}
            </span>
          ) : null}
          <Link
            href="/asignaciones"
            className="rounded-full border border-cyan-200/25 px-3 py-1 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-300/10"
          >
            Ver todos
          </Link>
        </div>
      ) : null}

      <div className="rounded-[28px] border border-white/10 bg-slate-950/55 p-6 backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Equipos asignados actualmente</h2>
            <p className="mt-1 text-sm text-slate-400">
              Estos son los equipos que tienen el colaborador marcado como responsable en la ficha del equipo.
            </p>
            {collaborator ? (
              <p className="mt-2 text-sm text-cyan-100">
                Colaborador visible: <span className="font-semibold text-white">{collaborator.fullName}</span>
                {latestAssignment ? (
                  <>
                    {" "}
                    | Fecha de asignación:{" "}
                    <span className="font-semibold text-white">{latestAssignment.assignedAt}</span>
                  </>
                ) : null}
              </p>
            ) : null}
          </div>
          <span className="rounded-full border border-cyan-300/25 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
            {assignedEquipment.length} equipos
          </span>
        </div>

        <div className="mt-6">
          <AssignedEquipmentTable rows={assignedEquipment} />
        </div>

        {assignedEquipment.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/8 p-4 text-sm text-amber-100">
            No se están viendo equipos asignados para este colaborador. Revisa si el campo
            <code className="mx-1 rounded bg-black/20 px-1 py-0.5 text-amber-50">colaborador_id</code> está
            cargado en los equipos o si la asignación existe solo en el historial.
          </div>
        ) : null}
      </div>

      <div className="rounded-[28px] border border-white/10 bg-slate-950/55 p-6 backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Historial de asignaciones</h2>
            <p className="mt-1 text-sm text-slate-400">Movimientos registrados en la tabla de asignaciones.</p>
            {collaborator ? (
              <p className="mt-2 text-sm text-cyan-100">
                Colaborador: <span className="font-semibold text-white">{collaborator.fullName}</span>
                {latestAssignment ? (
                  <>
                    {" "}
                    | Fecha de última asignación:{" "}
                    <span className="font-semibold text-white">{latestAssignment.assignedAt}</span>
                  </>
                ) : null}
              </p>
            ) : null}
          </div>
          <span className="rounded-full border border-cyan-300/25 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
            {assignments.length} registros
          </span>
        </div>

        <div className="mt-6 overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/55 backdrop-blur">
          <table className="min-w-full divide-y divide-white/10 text-left text-sm">
            <thead className="bg-white/5 text-slate-300">
              <tr>
                <th className="px-5 py-3 font-medium">Equipo</th>
                <th className="px-5 py-3 font-medium">Colaborador</th>
                <th className="px-5 py-3 font-medium">Empresa</th>
                <th className="px-5 py-3 font-medium">Asignado por</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3 font-medium">Fecha asignación</th>
                <th className="px-5 py-3 font-medium">Devolución</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {assignments.map((assignment) => (
                <tr key={assignment.id}>
                  <td className="px-5 py-4">
                    <div className="font-medium text-white">{assignment.equipmentCode}</div>
                    <div className="text-xs text-slate-400">{assignment.equipmentType}</div>
                  </td>
                  <td className="px-5 py-4 text-white">{assignment.collaboratorName}</td>
                  <td className="px-5 py-4 text-slate-300">{assignment.companyName}</td>
                  <td className="px-5 py-4 text-slate-300">{assignment.assignedBy}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                      {assignment.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-300">{assignment.assignedAt}</td>
                  <td className="px-5 py-4 text-slate-400">{assignment.returnedAt ?? "Pendiente"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {assignments.length === 0 ? (
        <div className="rounded-[24px] border border-white/10 bg-slate-950/55 p-6 text-sm text-slate-300">
          No hay asignaciones para mostrar en este filtro.
        </div>
      ) : null}
    </section>
  );
}
