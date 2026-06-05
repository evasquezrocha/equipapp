"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CompanyCrudRow, CompanyInput } from "@/lib/catalog-types";

type CompanyFormState = CompanyInput & { id?: number };

const emptyForm: CompanyFormState = {
  name: "",
  taxId: "",
  domain: "",
  contactPerson: "",
  contactEmail: "",
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

export function CompanyCrud({
  rows,
  canManage,
}: {
  rows: ReadonlyArray<CompanyCrudRow>;
  canManage: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState<CompanyFormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function startEdit(row: CompanyCrudRow) {
    setForm({
      id: row.id,
      name: row.name,
      taxId: row.taxId,
      domain: row.domain ?? "",
      contactPerson: row.contactPerson ?? "",
      contactEmail: row.contactEmail ?? "",
      phone: row.phone ?? "",
    });
    setMessage(`Editando ${row.name}`);
  }

  function resetForm() {
    setForm(emptyForm);
    setMessage(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        domain: form.domain?.trim() || undefined,
        contactPerson: form.contactPerson?.trim() || undefined,
        contactEmail: form.contactEmail?.trim() || undefined,
        phone: form.phone?.trim() || undefined,
      };

      if (form.id) {
        await requestJson("/api/empresas", {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setMessage("Empresa actualizada.");
      } else {
        await requestJson("/api/empresas", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setMessage("Empresa creada.");
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
    if (!window.confirm("¿Desactivar esta empresa?")) {
      return;
    }

    setSubmitting(true);
    try {
      await requestJson(`/api/empresas?id=${id}`, { method: "DELETE" });
      setMessage("Empresa desactivada.");
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
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(340px,0.7fr)]">
      <div className="overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/55 backdrop-blur">
        <table className="min-w-full divide-y divide-white/10 text-left text-sm">
          <thead className="bg-white/5 text-slate-300">
            <tr>
              <th className="px-5 py-3 font-medium">Empresa</th>
              <th className="px-5 py-3 font-medium">Contacto</th>
              <th className="px-5 py-3 font-medium">Usuarios</th>
              <th className="px-5 py-3 font-medium">Equipos</th>
              <th className="px-5 py-3 font-medium">Estado</th>
              <th className="px-5 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-200">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-5 py-4">
                  <div className="font-medium text-white">{row.name}</div>
                  <div className="text-xs text-slate-400">{row.taxId}</div>
                </td>
                <td className="px-5 py-4 text-slate-300">
                  <div>{row.contactEmail ?? "Sin correo"}</div>
                  <div className="text-xs text-slate-500">{row.phone ?? row.contactPerson ?? "-"}</div>
                </td>
                <td className="px-5 py-4">{row.users}</td>
                <td className="px-5 py-4">{row.equipment}</td>
                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      row.active ? "bg-emerald-400/10 text-emerald-300" : "bg-slate-400/10 text-slate-300"
                    }`}
                  >
                    {row.active ? "Activa" : "Inactiva"}
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
            {form.id ? "Editar empresa" : "Nueva empresa"}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {form.id ? form.name : "Crear empresa"}
          </h2>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {[
            ["name", "Nombre", "text"],
            ["taxId", "RUT / ID", "text"],
            ["domain", "Dominio", "text"],
            ["contactPerson", "Contacto principal", "text"],
            ["contactEmail", "Correo contacto", "email"],
            ["phone", "Teléfono", "text"],
          ].map(([key, label, type]) => (
            <label key={key} className="block">
              <span className="mb-2 block text-sm font-medium text-slate-200">{label}</span>
              <input
                type={type}
                value={(form as Record<string, string | number | undefined>)[key] ?? ""}
                onChange={(event) =>
                  setForm((current) => ({ ...current, [key]: event.target.value }))
                }
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

