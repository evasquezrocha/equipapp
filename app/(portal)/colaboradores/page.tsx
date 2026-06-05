import { getSessionFromCookies } from "@/lib/auth";
import { listCollaborators, listCompanySelect } from "@/lib/catalog-data";
import { CollaboratorCrud } from "@/components/collaborator-crud";

export const dynamic = "force-dynamic";

export default async function ColaboradoresPage() {
  const session = await getSessionFromCookies();
  if (!session) {
    return null;
  }

  const [rows, companies] = await Promise.all([
    listCollaborators(session).catch(() => []),
    listCompanySelect(session).catch(() => []),
  ]);

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.25em] text-cyan-300/80">Personas</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Colaboradores</h1>
        <p className="mt-2 max-w-2xl text-slate-300">
          Mantén el catálogo de colaboradores por empresa y enlaza sus equipos asignados.
        </p>
      </div>

      <CollaboratorCrud rows={rows} companies={companies} canManage={session.isAdmin} />
    </section>
  );
}
