import { getSessionFromCookies } from "@/lib/auth";
import { listCompanySelect } from "@/lib/catalog-data";
import { listAdminUsers, listRoles } from "@/lib/user-admin-data";
import { UserAdminCrud } from "@/components/user-admin-crud";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const session = await getSessionFromCookies();
  if (!session) {
    return null;
  }

  if (!session.isAdmin) {
    return (
      <section className="rounded-[28px] border border-white/10 bg-slate-950/55 p-6 text-slate-200">
        No tienes permisos para administrar usuarios.
      </section>
    );
  }

  const [rows, roles, companies] = await Promise.all([
    listAdminUsers(session).catch(() => []),
    listRoles().catch(() => []),
    listCompanySelect(session).catch(() => []),
  ]);

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.25em] text-cyan-300/80">Administracion</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Usuarios</h1>
        <p className="mt-2 max-w-2xl text-slate-300">
          Aqui puedes crear nuevas cuentas para acceder a la plataforma. Los usuarios normales
          solo ven las empresas que se les asignen.
        </p>
      </div>

      <UserAdminCrud rows={rows} roles={roles} companies={companies} />
    </section>
  );
}
