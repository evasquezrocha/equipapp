"use client";

import { useMemo, useState } from "react";
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

type SortKey = "fullName" | "companyName" | "code" | "cargo" | "equipmentCount" | "state";

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

function normalizeText(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function uniqueValues(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      values
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  ).sort((left, right) => left.localeCompare(right, "es"));
}

function sortValue(row: CollaboratorCrudRow, key: SortKey) {
  switch (key) {
    case "fullName":
      return row.fullName;
    case "companyName":
      return row.companyName;
    case "code":
      return row.code;
    case "cargo":
      return row.cargo ?? "";
    case "equipmentCount":
      return row.equipmentCount;
    case "state":
      return row.active ? "Activo" : "Inactivo";
    default:
      return row.fullName;
  }
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
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [cargoFilter, setCargoFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("fullName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const companyOptions = useMemo(() => uniqueValues(rows.map((row) => row.companyName)), [rows]);
  const cargoOptions = useMemo(() => uniqueValues(rows.map((row) => row.cargo)), [rows]);

  const filteredRows = useMemo(() => {
    const term = normalizeText(search);
    const visibleRows = rows.filter((row) => {
      if (companyFilter && row.companyName !== companyFilter) {
        return false;
      }
      if (stateFilter) {
        const normalizedState = row.active ? "activo" : "inactivo";
        if (normalizedState !== stateFilter) {
          return false;
        }
      }
      if (cargoFilter && (row.cargo ?? "") !== cargoFilter) {
        return false;
      }
      if (!term) {
        return true;
      }

      const searchable = [row.fullName, row.code, row.companyName, row.email, row.cargo, row.phone]
        .filter(Boolean)
        .map((value) => normalizeText(value));

      return searchable.some((value) => value.includes(term));
    });

    return [...visibleRows].sort((left, right) => {
      const a = sortValue(left, sortKey);
      const b = sortValue(right, sortKey);
      const factor = sortDirection === "asc" ? 1 : -1;
      if (typeof a === "number" || typeof b === "number") {
        return (Number(a) - Number(b)) * factor;
      }
      return String(a).localeCompare(String(b), "es") * factor;
    });
  }, [rows, search, companyFilter, stateFilter, cargoFilter, sortKey, sortDirection]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDirection("asc");
  }

  const sortIndicator = (key: SortKey) => (sortKey === key ? (sortDirection === "asc" ? " ↑" : " ↓") : "");

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

      setForm(emptyForm);
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
      if (form.id === id) {
        setForm(emptyForm);
      }
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo desactivar.");
    } finally {
      setSubmitting(false);
    }
  }

  function loadRow(row: CollaboratorCrudRow) {
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

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(340px,0.7fr)]">
      <div className="space-y-4">
        <div className="grid gap-3 rounded-[24px] border border-white/10 bg-slate-950/55 p-4 backdrop-blur md:grid-cols-2 xl:grid-cols-4">
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">Buscar</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nombre, código, correo..."
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">Empresa</span>
            <select
              value={companyFilter}
              onChange={(event) => setCompanyFilter(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none"
            >
              <option value="">Todas</option>
              {companyOptions.map((companyName) => (
                <option key={companyName} value={companyName}>
                  {companyName}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">Cargo</span>
            <select
              value={cargoFilter}
              onChange={(event) => setCargoFilter(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none"
            >
              <option value="">Todos</option>
              {cargoOptions.map((cargo) => (
                <option key={cargo} value={cargo}>
                  {cargo}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">Estado</span>
            <select
              value={stateFilter}
              onChange={(event) => setStateFilter(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none"
            >
              <option value="">Todos</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </label>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/55 backdrop-blur">
          <table className="min-w-full divide-y divide-white/10 text-left text-sm">
            <thead className="bg-white/5 text-slate-300">
              <tr>
                <th className="px-5 py-3 font-medium">
                  <button type="button" onClick={() => toggleSort("fullName")} className="text-left">
                    Colaborador{sortIndicator("fullName")}
                  </button>
                </th>
                <th className="px-5 py-3 font-medium">
                  <button type="button" onClick={() => toggleSort("companyName")} className="text-left">
                    Empresa{sortIndicator("companyName")}
                  </button>
                </th>
                <th className="px-5 py-3 font-medium">
                  <button type="button" onClick={() => toggleSort("code")} className="text-left">
                    Código{sortIndicator("code")}
                  </button>
                </th>
                <th className="px-5 py-3 font-medium">
                  <button type="button" onClick={() => toggleSort("cargo")} className="text-left">
                    Cargo{sortIndicator("cargo")}
                  </button>
                </th>
                <th className="px-5 py-3 font-medium">
                  <button type="button" onClick={() => toggleSort("equipmentCount")} className="text-left">
                    Equipos{sortIndicator("equipmentCount")}
                  </button>
                </th>
                <th className="px-5 py-3 font-medium">
                  <button type="button" onClick={() => toggleSort("state")} className="text-left">
                    Estado{sortIndicator("state")}
                  </button>
                </th>
                <th className="px-5 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {filteredRows.map((row) => (
                <tr
                  key={row.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/asignaciones?colaboradorId=${row.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      router.push(`/asignaciones?colaboradorId=${row.id}`);
                    }
                  }}
                  className="cursor-pointer transition hover:bg-white/5"
                >
                  <td className="px-5 py-4">
                    <div className="font-medium text-white">{row.fullName}</div>
                    <div className="text-xs text-slate-400">{row.email ?? "Sin correo"}</div>
                  </td>
                  <td className="px-5 py-4 text-slate-300">{row.companyName}</td>
                  <td className="px-5 py-4 text-slate-300">{row.code}</td>
                  <td className="px-5 py-4 text-slate-300">{row.cargo ?? "-"}</td>
                  <td className="px-5 py-4 text-slate-300">{row.equipmentCount}</td>
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
                        onClick={(event) => {
                          event.stopPropagation();
                          loadRow(row);
                        }}
                        className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-100"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleDelete(row.id);
                        }}
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
      </div>

      <aside className="rounded-[28px] border border-white/10 bg-slate-950/55 p-6 backdrop-blur">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300/80">
            {form.id ? "Editar colaborador" : "Nuevo colaborador"}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{form.id ? form.code : "Crear colaborador"}</h2>
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
              onClick={() => {
                setForm(emptyForm);
                setMessage(null);
              }}
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
