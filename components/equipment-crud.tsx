"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CollaboratorSelectRow, CompanySelectRow, EquipmentCrudRow } from "@/lib/catalog-types";

type EquipmentFormState = {
  id?: number;
  companyId: number;
  typeName: string;
  code: string;
  serial: string;
  brand: string;
  model: string;
  color: string;
  state: string;
  condition: string;
  ownership: string;
  collaboratorId: string;
  purchaseDate: string;
  estimatedCost: string;
  notes: string;
};

const emptyForm: EquipmentFormState = {
  companyId: 0,
  typeName: "",
  code: "",
  serial: "",
  brand: "",
  model: "",
  color: "",
  state: "Disponible",
  condition: "Operativo",
  ownership: "Propio",
  collaboratorId: "",
  purchaseDate: "",
  estimatedCost: "",
  notes: "",
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

export function EquipmentCrud({
  rows,
  companies,
  collaborators,
  canManage,
}: {
  rows: ReadonlyArray<EquipmentCrudRow>;
  companies: ReadonlyArray<CompanySelectRow>;
  collaborators: ReadonlyArray<CollaboratorSelectRow>;
  canManage: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState<EquipmentFormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function startEdit(row: EquipmentCrudRow) {
    setForm({
      id: row.id,
      companyId: row.companyId,
      typeName: row.typeName,
      code: row.code,
      serial: row.serial ?? "",
      brand: row.brand ?? "",
      model: row.model ?? "",
      color: row.color ?? "",
      state: row.state,
      condition: row.condition,
      ownership: row.ownership,
      collaboratorId: row.collaboratorId ? String(row.collaboratorId) : "",
      purchaseDate: row.purchaseDate ?? "",
      estimatedCost: row.estimatedCost ? String(row.estimatedCost) : "",
      notes: row.notes ?? "",
    });
    setMessage(`Editando ${row.code}`);
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
        collaboratorId: form.collaboratorId ? Number(form.collaboratorId) : null,
        estimatedCost: form.estimatedCost ? Number(form.estimatedCost) : null,
        serial: form.serial.trim() || undefined,
        brand: form.brand.trim() || undefined,
        model: form.model.trim() || undefined,
        color: form.color.trim() || undefined,
        notes: form.notes.trim() || undefined,
        purchaseDate: form.purchaseDate || undefined,
      };

      if (form.id) {
        await requestJson("/api/equipos", {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setMessage("Equipo actualizado.");
      } else {
        await requestJson("/api/equipos", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setMessage("Equipo creado.");
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
    if (!window.confirm("¿Dar de baja este equipo?")) {
      return;
    }

    setSubmitting(true);
    try {
      await requestJson(`/api/equipos?id=${id}`, { method: "DELETE" });
      setMessage("Equipo dado de baja.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo dar de baja.");
    } finally {
      setSubmitting(false);
    }
  }

  const collaboratorOptions = collaborators.filter((item) => !form.companyId || item.companyId === form.companyId);
  const formValues = {
    typeName: form.typeName,
    code: form.code,
    serial: form.serial,
    brand: form.brand,
    model: form.model,
    color: form.color,
    state: form.state,
    condition: form.condition,
    ownership: form.ownership,
    purchaseDate: form.purchaseDate,
    estimatedCost: form.estimatedCost,
    notes: form.notes,
  } as const;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(360px,0.7fr)]">
      <div className="overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/55 backdrop-blur">
        <table className="min-w-full divide-y divide-white/10 text-left text-sm">
          <thead className="bg-white/5 text-slate-300">
            <tr>
              <th className="px-5 py-3 font-medium">Código</th>
              <th className="px-5 py-3 font-medium">Tipo</th>
              <th className="px-5 py-3 font-medium">Empresa</th>
              <th className="px-5 py-3 font-medium">Asignado a</th>
              <th className="px-5 py-3 font-medium">Estado</th>
              <th className="px-5 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-200">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-5 py-4">
                  <div className="font-medium text-white">{row.code}</div>
                  <div className="text-xs text-slate-400">{row.serial ?? "Sin serial"}</div>
                </td>
                <td className="px-5 py-4">
                  <div>{row.typeName}</div>
                  <div className="text-xs text-slate-400">
                    {row.brand ?? "-"} {row.model ? `· ${row.model}` : ""}
                  </div>
                </td>
                <td className="px-5 py-4 text-slate-300">{row.companyName}</td>
                <td className="px-5 py-4">{row.collaboratorName ?? "Sin asignar"}</td>
                <td className="px-5 py-4">
                  <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
                    {row.state} · {row.condition}
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
                      Dar de baja
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
            {form.id ? "Editar equipo" : "Nuevo equipo"}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {form.id ? form.code : "Crear equipo"}
          </h2>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">Empresa</span>
            <select
              value={form.companyId}
              onChange={(event) => {
                const companyId = Number(event.target.value);
                setForm((current) => ({ ...current, companyId, collaboratorId: "" }));
              }}
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

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">Colaborador</span>
            <select
              value={form.collaboratorId}
              onChange={(event) => setForm((current) => ({ ...current, collaboratorId: event.target.value }))}
              disabled={!canManage}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-300/60 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">Sin asignar</option>
              {collaboratorOptions.map((collaborator) => (
                <option key={collaborator.id} value={collaborator.id}>
                  {collaborator.name}
                </option>
              ))}
            </select>
          </label>

            {[
              ["typeName", "Tipo"],
              ["code", "Código"],
              ["serial", "Serial"],
            ["brand", "Marca"],
            ["model", "Modelo"],
            ["color", "Color"],
            ["state", "Estado"],
            ["condition", "Condición"],
            ["ownership", "Propiedad"],
            ["purchaseDate", "Fecha compra"],
            ["estimatedCost", "Costo estimado"],
            ["notes", "Observaciones"],
          ].map(([key, label]) => (
            <label key={key} className="block">
              <span className="mb-2 block text-sm font-medium text-slate-200">{label}</span>
              <input
                type={key === "purchaseDate" ? "date" : key === "estimatedCost" ? "number" : "text"}
                step={key === "estimatedCost" ? "0.01" : undefined}
                value={formValues[key as keyof typeof formValues] ?? ""}
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
