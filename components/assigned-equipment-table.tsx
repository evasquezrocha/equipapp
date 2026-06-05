"use client";

import { useMemo, useState } from "react";
import type { EquipmentCrudRow } from "@/lib/catalog-types";

type SortKey = "code" | "typeName" | "companyName" | "collaboratorName" | "state" | "condition" | "processor" | "ram" | "storage";

type AssignedEquipmentTableProps = {
  rows: ReadonlyArray<EquipmentCrudRow>;
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

function sortValue(row: EquipmentCrudRow, key: SortKey) {
  switch (key) {
    case "code":
      return row.code;
    case "typeName":
      return row.typeName;
    case "companyName":
      return row.companyName;
    case "collaboratorName":
      return row.collaboratorName ?? "";
    case "state":
      return row.state;
    case "condition":
      return row.condition;
    case "processor":
      return row.processor ?? "";
    case "ram":
      return row.ram ?? "";
    case "storage":
      return row.storage ?? "";
    default:
      return row.code;
  }
}

export function AssignedEquipmentTable({ rows }: AssignedEquipmentTableProps) {
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("code");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const companyOptions = useMemo(() => uniqueValues(rows.map((row) => row.companyName)), [rows]);
  const typeOptions = useMemo(() => uniqueValues(rows.map((row) => row.typeName)), [rows]);
  const stateOptions = useMemo(() => uniqueValues(rows.map((row) => row.state)), [rows]);

  const filteredRows = useMemo(() => {
    const term = normalizeText(search);
    const visibleRows = rows.filter((row) => {
      if (companyFilter && row.companyName !== companyFilter) {
        return false;
      }
      if (typeFilter && row.typeName !== typeFilter) {
        return false;
      }
      if (stateFilter && row.state !== stateFilter) {
        return false;
      }
      if (!term) {
        return true;
      }

      const searchable = [
        row.code,
        row.typeName,
        row.companyName,
        row.collaboratorName,
        row.state,
        row.condition,
        row.processor,
        row.ram,
        row.storage,
      ]
        .filter(Boolean)
        .map((value) => normalizeText(value));

      return searchable.some((value) => value.includes(term));
    });

    return [...visibleRows].sort((left, right) => {
      const a = sortValue(left, sortKey);
      const b = sortValue(right, sortKey);
      const factor = sortDirection === "asc" ? 1 : -1;
      return String(a).localeCompare(String(b), "es") * factor;
    });
  }, [rows, search, companyFilter, typeFilter, stateFilter, sortKey, sortDirection]);

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
            placeholder="Código, tipo, colaborador..."
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
            {companyOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">Tipo</span>
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none"
          >
            <option value="">Todos</option>
            {typeOptions.map((item) => (
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
            {stateOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="min-w-full divide-y divide-white/10 text-left text-sm">
          <thead className="bg-white/5 text-slate-300">
            <tr>
              <th className="px-4 py-3 font-medium">
                <button type="button" onClick={() => toggleSort("code")} className="text-left">
                  Código{sortIndicator("code")}
                </button>
              </th>
              <th className="px-4 py-3 font-medium">
                <button type="button" onClick={() => toggleSort("typeName")} className="text-left">
                  Tipo{sortIndicator("typeName")}
                </button>
              </th>
              <th className="px-4 py-3 font-medium">
                <button type="button" onClick={() => toggleSort("companyName")} className="text-left">
                  Empresa{sortIndicator("companyName")}
                </button>
              </th>
              <th className="px-4 py-3 font-medium">
                <button type="button" onClick={() => toggleSort("collaboratorName")} className="text-left">
                  Colaborador{sortIndicator("collaboratorName")}
                </button>
              </th>
              <th className="px-4 py-3 font-medium">
                <button type="button" onClick={() => toggleSort("state")} className="text-left">
                  Estado{sortIndicator("state")}
                </button>
              </th>
              <th className="px-4 py-3 font-medium">
                <button type="button" onClick={() => toggleSort("condition")} className="text-left">
                  Condición{sortIndicator("condition")}
                </button>
              </th>
              <th className="px-4 py-3 font-medium">
                <button type="button" onClick={() => toggleSort("processor")} className="text-left">
                  Procesador{sortIndicator("processor")}
                </button>
              </th>
              <th className="px-4 py-3 font-medium">
                <button type="button" onClick={() => toggleSort("ram")} className="text-left">
                  RAM{sortIndicator("ram")}
                </button>
              </th>
              <th className="px-4 py-3 font-medium">
                <button type="button" onClick={() => toggleSort("storage")} className="text-left">
                  Almacenamiento{sortIndicator("storage")}
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-200">
            {filteredRows.map((equipment) => (
              <tr key={equipment.id}>
                <td className="px-4 py-3 font-medium text-white">{equipment.code}</td>
                <td className="px-4 py-3">{equipment.typeName}</td>
                <td className="px-4 py-3 text-slate-300">{equipment.companyName}</td>
                <td className="px-4 py-3 text-slate-300">{equipment.collaboratorName ?? "Sin asignar"}</td>
                <td className="px-4 py-3">{equipment.state}</td>
                <td className="px-4 py-3 text-slate-300">{equipment.condition}</td>
                <td className="px-4 py-3 text-slate-300">{equipment.processor ?? "Sin dato"}</td>
                <td className="px-4 py-3 text-slate-300">{equipment.ram ?? "Sin dato"}</td>
                <td className="px-4 py-3 text-slate-300">{equipment.storage ?? "Sin dato"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
