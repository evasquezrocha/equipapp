import { getSessionFromCookies } from "@/lib/auth";
import {
  listCollaboratorSelect,
  listCompanySelect,
  listEquipment,
} from "@/lib/catalog-data";
import { EquipmentCrud } from "@/components/equipment-crud";

export const dynamic = "force-dynamic";

export default async function EquiposPage() {
  const session = await getSessionFromCookies();
  if (!session) {
    return null;
  }

  const [rows, companies, collaborators] = await Promise.all([
    listEquipment(session).catch(() => []),
    listCompanySelect(session).catch(() => []),
    listCollaboratorSelect(session).catch(() => []),
  ]);

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.25em] text-cyan-300/80">Inventario</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Equipos tecnológicos</h1>
        <p className="mt-2 max-w-2xl text-slate-300">
          Consolida computadores, impresoras, celulares y tablets con trazabilidad por empresa y
          colaborador.
        </p>
      </div>

      <EquipmentCrud
        rows={rows}
        companies={companies}
        collaborators={collaborators}
        canManage={session.isAdmin}
      />
    </section>
  );
}
