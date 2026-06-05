"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CollaboratorCrudRow, CompanySelectRow } from "@/lib/catalog-types";

type SortKey = "fullName" | "companyName" | "code" | "cargo" | "equipmentCount" | "state";

type CollaboratorListProps = {
  rows: ReadonlyArray<CollaboratorCrudRow>;
  companies: ReadonlyArray<CompanySelectRow>;
  canManage: boolean;
  onEdit: (row: CollaboratorCrudRow) => void;
  onDelete: (id: number) => void;
};

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

export function CollaboratorList({ rows, companies, canManage, onEdit, onDelete }: CollaboratorListProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [cargoFilter, setCargoFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("fullName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

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

      const searchable = [
        row.fullName,
        row.code,
        row.companyName,
        row.email,
        row.cargo,
        row.phone,
      ]
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

  return (
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
            {companies.map((company) => (
              <option key={company.id} value={company.name}>
                {company.name}
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
            {cargoOptions.map((item) => (
              <option key={item} value={item}>
                {item}
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
                        onEdit(row);
                      }}
                      className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-100"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        void onDelete(row.id);
                      }}
                      disabled={!canManage}
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
  );
}
