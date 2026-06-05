"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CollaboratorCrudRow, CompanySelectRow } from "@/lib/catalog-types";

type CollaboratorFormState = {
  id?: number;
  companyId: number;
  code: string;
  firstName: string;
  lastName: string;
  email: string;
  cargo: string;
  phone: string;
};

const emptyForm: CollaboratorFormState = {
  companyId: 0,
  code: "",
  firstName: "",
  lastName: "",
  email: "",
  cargo: "",
  phone: "",
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
    throw new Error(payload?.error ?? "Operación fallida.");
  }
  return payload;
}

export function CollaboratorCrud({
  rows,
  companies,
  canManage,
}: {
  rows: ReadonlyArray<CollaboratorCrudRow>;
  companies: ReadonlyArray<CompanySelectRow>;
  canManage: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState<CollaboratorFormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function startEdit(row: CollaboratorCrudRow) {
    setForm({
      id: row.id,
      companyId: row.companyId,
      code: row.code,
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email ?? "",
      cargo: row.cargo ?? "",
      phone: row.phone ?? "",
    });
    setMessage(`Editando ${row.fullName}`);
  }

  function resetForm() {
    setForm(emptyForm);
    setMessage(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.companyId) {
      setMessage("Debes seleccionar una empresa.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        email: form.email.trim() || undefined,
        cargo: form.cargo.trim() || undefined,
        phone: form.phone.trim() || undefined,
      };

      if (form.id) {
        await requestJson("/api/colaboradores", {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setMessage("Colaborador actualizado.");
      } else {
        await requestJson("/api/colaboradores", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setMessage("Colaborador creado.");
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
    if (!window.confirm("¿Desactivar este colaborador?")) {
      return;
    }

    setSubmitting(true);
    try {
      await requestJson(`/api/colaboradores?id=${id}`, { method: "DELETE" });
      setMessage("Colaborador desactivado.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo desactivar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(340px,0.7fr)]">
      <div className="overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/55 backdrop-blur">
        <table className="min-w-full divide-y divide-white/10 text-left text-sm">
          <thead className="bg-white/5 text-slate-300">
            <tr>
              <th className="px-5 py-3 font-medium">Colaborador</th>
              <th className="px-5 py-3 font-medium">Empresa</th>
              <th className="px-5 py-3 font-medium">Cargo</th>
              <th className="px-5 py-3 font-medium">Equipos</th>
              <th className="px-5 py-3 font-medium">Estado</th>
              <th className="px-5 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-200">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-5 py-4">
                  <div className="font-medium text-white">{row.fullName}</div>
                  <div className="text-xs text-slate-400">{row.code}</div>
                </td>
                <td className="px-5 py-4 text-slate-300">{row.companyName}</td>
                <td className="px-5 py-4">{row.cargo ?? "-"}</td>
                <td className="px-5 py-4">{row.equipmentCount}</td>
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
                      onClick={() => handleDelete(row.id)}
                      disabled={!canManage || submitting}
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
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300/80">
            {form.id ? "Editar colaborador" : "Nuevo colaborador"}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {form.id ? form.code : "Crear colaborador"}
          </h2>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">Empresa</span>
            <select
              value={form.companyId}
              onChange={(event) => setForm((current) => ({ ...current, companyId: Number(event.target.value) }))}
              disabled={!canManage}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-300/60 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value={0}>Selecciona una empresa</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </label>

          {[
            ["code", "Código"],
            ["firstName", "Nombres"],
            ["lastName", "Apellidos"],
            ["email", "Correo"],
            ["cargo", "Cargo"],
            ["phone", "Teléfono"],
          ].map(([key, label]) => (
            <label key={key} className="block">
              <span className="mb-2 block text-sm font-medium text-slate-200">{label}</span>
              <input
                type={key === "email" ? "email" : "text"}
                value={(form as Record<string, string | number | undefined>)[key] ?? ""}
                onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                disabled={!canManage}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-300/60 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>
          ))}

          {message ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
              {message}
            </div>
          ) : null}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!canManage || submitting}
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
    </div>
  );
}
