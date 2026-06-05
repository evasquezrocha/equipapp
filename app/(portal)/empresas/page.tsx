import { getSessionFromCookies } from "@/lib/auth";
import { listCompanies } from "@/lib/catalog-data";
import { CompanyCrud } from "@/components/company-crud";

export const dynamic = "force-dynamic";

export default async function EmpresasPage() {
  const session = await getSessionFromCookies();
  if (!session) {
    return null;
  }

  const rows = await listCompanies(session).catch(() => []);

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.25em] text-cyan-300/80">Catálogo</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Empresas</h1>
        <p className="mt-2 max-w-2xl text-slate-300">
          Cada empresa funciona como un tenant aislado. El administrador puede crear y desactivar
          empresas; el resto solo ve su alcance.
        </p>
      </div>

      <CompanyCrud rows={rows} canManage={session.isAdmin} />
    </section>
  );
}
