"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminCompanyRow, AdminRoleRow, AdminUserRow } from "@/lib/user-admin-data";
import { ChangePasswordDialog } from "@/components/change-password-dialog";
import { KeyIcon } from "@/components/nav-icons";

type UserFormState = {
  id?: number;
  name: string;
  email: string;
  password: string;
  roleId: string;
  companyIds: string[];
};

const emptyForm: UserFormState = {
  name: "",
  email: "",
  password: "",
  roleId: "",
  companyIds: [],
};

async function requestJson(url: string, init: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error ?? "Operacion fallida.");
  }
  return payload;
}

export function UserAdminCrud({
  rows,
  roles,
  companies,
}: {
  rows: ReadonlyArray<AdminUserRow>;
  roles: ReadonlyArray<AdminRoleRow>;
  companies: ReadonlyArray<AdminCompanyRow>;
}) {
  const router = useRouter();
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [passwordTarget, setPasswordTarget] = useState<{ id: number; name: string; email: string } | null>(null);

  const selectedRole = useMemo(
    () => roles.find((role) => String(role.id) === form.roleId),
    [form.roleId, roles],
  );
  const roleIsAdmin = Boolean(selectedRole?.puede_ver_todo);

  function startCreate() {
    setForm(emptyForm);
    setMessage("Nuevo usuario");
  }

  function startEdit(row: AdminUserRow) {
    setForm({
      id: row.id,
      name: row.name,
      email: row.email,
      password: "",
      roleId: String(row.roleId),
      companyIds: row.companyIdsCsv ? row.companyIdsCsv.split(",").filter(Boolean) : [],
    });
    setMessage(`Editando ${row.name}`);
  }

  function resetForm() {
    setForm(emptyForm);
    setMessage(null);
  }

  function toggleCompany(companyId: number) {
    setForm((current) => {
      const value = String(companyId);
      const exists = current.companyIds.includes(value);
      return {
        ...current,
        companyIds: exists
          ? current.companyIds.filter((item) => item !== value)
          : [...current.companyIds, value],
      };
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        roleId: Number(form.roleId),
        companyIds: roleIsAdmin ? [] : form.companyIds.map(Number),
      };

      if (form.id) {
        await requestJson("/api/usuarios", {
          method: "PATCH",
          body: JSON.stringify({
            id: form.id,
            ...payload,
          }),
        });
        setMessage("Usuario actualizado.");
      } else {
        if (!form.password) {
          throw new Error("La contraseña inicial es obligatoria.");
        }
        await requestJson("/api/usuarios", {
          method: "POST",
          body: JSON.stringify({
            ...payload,
            password: form.password,
          }),
        });
        setMessage("Usuario creado.");
      }

      resetForm();
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo guardar.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Desactivar este usuario?")) {
      return;
    }

    setSubmitting(true);
    try {
      await requestJson(`/api/usuarios?id=${id}`, { method: "DELETE" });
      setMessage("Usuario desactivado.");
      if (form.id === id) {
        resetForm();
      }
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo desactivar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(380px,0.7fr)]">
      <div className="overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/55 backdrop-blur">
        <table className="min-w-full divide-y divide-white/10 text-left text-sm">
          <thead className="bg-white/5 text-slate-300">
            <tr>
              <th className="px-5 py-3 font-medium">Usuario</th>
              <th className="px-5 py-3 font-medium">Rol</th>
              <th className="px-5 py-3 font-medium">Empresas</th>
              <th className="px-5 py-3 font-medium">Estado</th>
              <th className="px-5 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-200">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-5 py-4">
                  <div className="font-medium text-white">{row.name}</div>
                  <div className="text-xs text-slate-400">{row.email}</div>
                </td>
                <td className="px-5 py-4">
                  <div>{row.roleName}</div>
                  <div className="text-xs text-slate-500">{row.roleCode}</div>
                </td>
                <td className="px-5 py-4 text-slate-300">
                  <div>{row.companyCount > 0 ? row.companyNames : "Sin empresas"}</div>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      row.active ? "bg-emerald-400/10 text-emerald-300" : "bg-slate-400/10 text-slate-300"
                    }`}
                  >
                    {row.active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(row)}
                      className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-100"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPasswordTarget({ id: row.id, name: row.name, email: row.email })
                      }
                      className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/20 px-3 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-400/10"
                    >
                      <KeyIcon className="h-4 w-4" aria-hidden="true" />
                      Contraseña
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(row.id)}
                      disabled={submitting}
                      className="rounded-xl border border-rose-400/20 px-3 py-2 text-xs font-semibold text-rose-100 disabled:opacity-50"
                    >
                      Desactivar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <aside className="rounded-[28px] border border-white/10 bg-slate-950/55 p-6 backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-300/80">
              {form.id ? "Editar usuario" : "Nuevo usuario"}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              {form.id ? form.name || "Editar cuenta" : "Crear cuenta"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Solo el administrador puede crear, editar, desactivar y cambiar contraseñas de usuarios.
            </p>
          </div>
          <button
            type="button"
            onClick={startCreate}
            className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-200"
          >
            Nuevo
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">Nombre</span>
            <input
              type="text"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-300/60"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">Correo</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-300/60"
            />
          </label>

          {!form.id ? (
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-200">Contraseña inicial</span>
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-300/60"
              />
            </label>
          ) : null}

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">Rol</span>
            <select
              value={form.roleId}
              onChange={(event) => setForm((current) => ({ ...current, roleId: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-300/60"
            >
              <option value="">Selecciona un rol</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.nombre}
                </option>
              ))}
            </select>
          </label>

          {roleIsAdmin ? (
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
              El rol administrador no requiere empresas asignadas.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm font-medium text-slate-200">Empresas</div>
              <div className="max-h-52 space-y-2 overflow-auto rounded-2xl border border-white/10 bg-slate-950/70 p-3">
                {companies.map((company) => {
                  const checked = form.companyIds.includes(String(company.id));
                  return (
                    <label
                      key={company.id}
                      className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/5"
                    >
                      <span>{company.name}</span>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCompany(company.id)}
                        className="h-4 w-4 rounded border-white/20 bg-slate-950"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {message ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
              {message}
            </div>
          ) : null}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Guardando..." : form.id ? "Actualizar" : "Crear"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-100"
            >
              Limpiar
            </button>
          </div>
        </form>
      </aside>

      <ChangePasswordDialog
        open={Boolean(passwordTarget)}
        onClose={() => setPasswordTarget(null)}
        targetUser={passwordTarget}
      />
    </div>
  );
}
