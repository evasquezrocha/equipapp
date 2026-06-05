"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CollaboratorSelectRow, CompanySelectRow, EquipmentCrudRow } from "@/lib/catalog-types";
import { EquipmentImagesDialog } from "@/components/equipment-images-dialog";
import { CameraIcon } from "@/components/nav-icons";

type CatalogFieldState = {
  selected: string;
  custom: string;
};

type EquipmentFormState = {
  id?: number;
  companyId: number;
  type: CatalogFieldState;
  code: string;
  serial: string;
  brand: CatalogFieldState;
  model: string;
  color: string;
  processor: string;
  ram: string;
  storage: string;
  state: CatalogFieldState;
  condition: CatalogFieldState;
  collaboratorId: string;
  purchaseDate: string;
  estimatedCost: string;
  notes: string;
};

type SortKey =
  | "code"
  | "typeName"
  | "processor"
  | "ram"
  | "storage"
  | "companyName"
  | "collaboratorName"
  | "state"
  | "condition"
  | "imageCount";

const CUSTOM_VALUE = "__custom__";

const defaultTypeOptions = ["Computador", "Impresora", "Celular", "Tablet", "Monitor"];
const defaultStateOptions = ["Disponible", "Asignado", "En reparacion", "Mantenimiento", "Baja"];
const defaultConditionOptions = ["Operativo", "En revision", "Dañado", "Retirado"];
const emptyForm: EquipmentFormState = {
  companyId: 0,
  type: { selected: defaultTypeOptions[0], custom: "" },
  code: "",
  serial: "",
  brand: { selected: "", custom: "" },
  model: "",
  color: "",
  processor: "",
  ram: "",
  storage: "",
  state: { selected: defaultStateOptions[0], custom: "" },
  condition: { selected: defaultConditionOptions[0], custom: "" },
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
    throw new Error(payload?.error ?? "Operacion fallida.");
  }
  return payload;
}

function normalizeText(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function uniqueValues(values: Array<string | null | undefined>, fallback: string[]) {
  const result = new Set<string>(fallback);
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) {
      result.add(trimmed);
    }
  }
  return Array.from(result).sort((a, b) => a.localeCompare(b, "es"));
}

function resolveCatalogValue(field: CatalogFieldState) {
  if (field.selected === CUSTOM_VALUE) {
    return field.custom.trim();
  }
  return field.selected.trim();
}

function getSelectionValue(value: string | null | undefined, options: string[]) {
  if (!value) {
    return "";
  }
  return options.includes(value) ? value : CUSTOM_VALUE;
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
    case "imageCount":
      return row.imageCount;
    default:
      return row.code;
  }
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
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("code");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [imageTarget, setImageTarget] = useState<EquipmentCrudRow | null>(null);

  const typeOptions = useMemo(
    () => uniqueValues(rows.map((row) => row.typeName), defaultTypeOptions),
    [rows],
  );
  const brandOptions = useMemo(
    () => uniqueValues(rows.map((row) => row.brand), []),
    [rows],
  );
  const stateOptions = useMemo(
    () => uniqueValues(rows.map((row) => row.state), defaultStateOptions),
    [rows],
  );
  const conditionOptions = useMemo(
    () => uniqueValues(rows.map((row) => row.condition), defaultConditionOptions),
    [rows],
  );

  function startCreate() {
    setForm(emptyForm);
    setMessage("Nuevo equipo");
  }

  function startEdit(row: EquipmentCrudRow) {
    setForm({
      id: row.id,
      companyId: row.companyId,
      type: {
        selected: getSelectionValue(row.typeName, typeOptions),
        custom: getSelectionValue(row.typeName, typeOptions) === CUSTOM_VALUE ? row.typeName : "",
      },
      code: row.code,
      serial: row.serial ?? "",
      brand: {
        selected: row.brand ? getSelectionValue(row.brand, brandOptions) : "",
        custom: row.brand && getSelectionValue(row.brand, brandOptions) === CUSTOM_VALUE ? row.brand : "",
      },
      model: row.model ?? "",
      color: row.color ?? "",
      processor: row.processor ?? "",
      ram: row.ram ?? "",
      storage: row.storage ?? "",
      state: {
        selected: getSelectionValue(row.state, stateOptions),
        custom: getSelectionValue(row.state, stateOptions) === CUSTOM_VALUE ? row.state : "",
      },
      condition: {
        selected: getSelectionValue(row.condition, conditionOptions),
        custom: getSelectionValue(row.condition, conditionOptions) === CUSTOM_VALUE ? row.condition : "",
      },
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

  const collaboratorOptions = useMemo(() => {
    return collaborators.filter((item) => !form.companyId || item.companyId === form.companyId);
  }, [collaborators, form.companyId]);

  const filteredRows = useMemo(() => {
    const term = normalizeText(search);
    const rowsToFilter = rows.filter((row) => {
      if (companyFilter && String(row.companyId) !== companyFilter) {
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
        row.serial,
        row.typeName,
        row.companyName,
        row.brand,
        row.model,
        row.color,
        row.processor,
        row.ram,
        row.storage,
        row.state,
        row.condition,
        row.collaboratorName,
        row.notes,
      ]
        .filter(Boolean)
        .map((value) => normalizeText(value));

      return searchable.some((value) => value.includes(term));
    });

    return [...rowsToFilter].sort((left, right) => {
      const a = sortValue(left, sortKey);
      const b = sortValue(right, sortKey);
      const multiplier = sortDirection === "asc" ? 1 : -1;

      if (typeof a === "number" || typeof b === "number") {
        return (Number(a) - Number(b)) * multiplier;
      }

      return String(a).localeCompare(String(b), "es") * multiplier;
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.companyId) {
      setMessage("Debes seleccionar una empresa.");
      return;
    }

    const typeName = resolveCatalogValue(form.type);
    const brand = resolveCatalogValue(form.brand);
    const state = resolveCatalogValue(form.state);
    const condition = resolveCatalogValue(form.condition);

    if (!typeName || !form.code.trim()) {
      setMessage("Completa al menos el tipo y el código.");
      return;
    }

    if (!state || !condition) {
      setMessage("Estado y condicion son obligatorios.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        companyId: form.companyId,
        typeName,
        code: form.code.trim(),
        serial: form.serial.trim() || undefined,
        brand: brand || undefined,
        model: form.model.trim() || undefined,
        color: form.color.trim() || undefined,
        processor: form.processor.trim() || undefined,
        ram: form.ram.trim() || undefined,
        storage: form.storage.trim() || undefined,
        state,
        condition,
        collaboratorId: form.collaboratorId ? Number(form.collaboratorId) : null,
        purchaseDate: form.purchaseDate || undefined,
        estimatedCost: form.estimatedCost ? Number(form.estimatedCost) : null,
        notes: form.notes.trim() || undefined,
      };

      const response = form.id
        ? await requestJson("/api/equipos", {
            method: "PATCH",
            body: JSON.stringify({
              id: form.id,
              ...payload,
            }),
          })
        : await requestJson("/api/equipos", {
            method: "POST",
            body: JSON.stringify(payload),
          });

      const equipmentId = form.id ?? response?.data?.id;
      setMessage(form.id ? "Equipo actualizado." : "Equipo creado.");
      resetForm();
      router.refresh();

      if (equipmentId) {
        // keep the editor ready for the next action; images are uploaded from the row action modal
        void equipmentId;
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo guardar.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Dar de baja este equipo?")) {
      return;
    }

    setSubmitting(true);
    try {
      await requestJson(`/api/equipos?id=${id}`, { method: "DELETE" });
      setMessage("Equipo dado de baja.");
      if (form.id === id) {
        resetForm();
      }
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo dar de baja.");
    } finally {
      setSubmitting(false);
    }
  }

  const sortIndicator = (key: SortKey) => (sortKey === key ? (sortDirection === "asc" ? " ↑" : " ↓") : "");

  return (
    <div className="space-y-6">
      <div className="grid gap-3 rounded-[24px] border border-white/10 bg-slate-950/55 p-4 backdrop-blur md:grid-cols-2 xl:grid-cols-5">
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">Buscar</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Codigo, serial, marca, colaborador..."
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
              <option key={company.id} value={company.id}>
                {company.name}
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(380px,0.6fr)]">
        <div className="overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/55 backdrop-blur">
          <table className="min-w-full divide-y divide-white/10 text-left text-sm">
            <thead className="bg-white/5 text-slate-300">
              <tr>
                <th className="px-5 py-3 font-medium">
                  <button type="button" onClick={() => toggleSort("companyName")} className="text-left">
                    Empresa{sortIndicator("companyName")}
                  </button>
                </th>
                <th className="px-5 py-3 font-medium">
                  <button type="button" onClick={() => toggleSort("code")} className="text-left">
                    Codigo{sortIndicator("code")}
                  </button>
                </th>
                <th className="px-5 py-3 font-medium">
                  <button type="button" onClick={() => toggleSort("typeName")} className="text-left">
                    Tipo{sortIndicator("typeName")}
                  </button>
                </th>
                <th className="px-5 py-3 font-medium">
                  <button type="button" onClick={() => toggleSort("processor")} className="text-left">
                    Procesador{sortIndicator("processor")}
                  </button>
                </th>
                <th className="px-5 py-3 font-medium">
                  <button type="button" onClick={() => toggleSort("ram")} className="text-left">
                    RAM{sortIndicator("ram")}
                  </button>
                </th>
                <th className="px-5 py-3 font-medium">
                  <button type="button" onClick={() => toggleSort("storage")} className="text-left">
                    Almacenamiento{sortIndicator("storage")}
                  </button>
                </th>
                <th className="px-5 py-3 font-medium">
                  <button type="button" onClick={() => toggleSort("collaboratorName")} className="text-left">
                    Asignado a{sortIndicator("collaboratorName")}
                  </button>
                </th>
                <th className="px-5 py-3 font-medium">
                  <button type="button" onClick={() => toggleSort("state")} className="text-left">
                    Estado{sortIndicator("state")}
                  </button>
                </th>
                <th className="px-5 py-3 font-medium">
                  <button type="button" onClick={() => toggleSort("condition")} className="text-left">
                    Condicion{sortIndicator("condition")}
                  </button>
                </th>
                <th className="px-5 py-3 font-medium">
                  <button type="button" onClick={() => toggleSort("imageCount")} className="text-left">
                    Fotos{sortIndicator("imageCount")}
                  </button>
                </th>
                <th className="px-5 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {filteredRows.map((row) => (
                <tr key={row.id}>
                  <td className="px-5 py-4 text-slate-300">{row.companyName}</td>
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
                  <td className="px-5 py-4 text-slate-300">{row.processor ?? "Sin dato"}</td>
                  <td className="px-5 py-4 text-slate-300">{row.ram ?? "Sin dato"}</td>
                  <td className="px-5 py-4 text-slate-300">{row.storage ?? "Sin dato"}</td>
                  <td className="px-5 py-4">{row.collaboratorName ?? "Sin asignar"}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
                      {row.state}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-300">{row.condition}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200">
                      {row.imageCount}
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
                        onClick={() => setImageTarget(row)}
                        className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/20 px-3 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-400/10"
                      >
                        <CameraIcon className="h-4 w-4" aria-hidden="true" />
                        Fotos
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(row.id)}
                        disabled={!canManage || submitting}
                        className="rounded-xl border border-rose-400/20 px-3 py-2 text-xs font-semibold text-rose-100 disabled:opacity-50"
                      >
                        Baja
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
                {form.id ? "Editar equipo" : "Nuevo equipo"}
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                {form.id ? form.code : "Crear equipo"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Selecciona valores existentes o escribe uno nuevo para crear catálogos al guardar.
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

            <div className="grid gap-4 md:grid-cols-2">
              <CatalogInput
                label="Tipo"
                selected={form.type.selected}
                custom={form.type.custom}
                options={typeOptions}
                onSelected={(value) => setForm((current) => ({ ...current, type: { ...current.type, selected: value } }))}
                onCustom={(value) => setForm((current) => ({ ...current, type: { ...current.type, custom: value } }))}
                canManage={canManage}
                required
              />
              <CatalogInput
                label="Marca"
                selected={form.brand.selected}
                custom={form.brand.custom}
                options={brandOptions}
                placeholder="Sin marca"
                onSelected={(value) => setForm((current) => ({ ...current, brand: { ...current.brand, selected: value } }))}
                onCustom={(value) => setForm((current) => ({ ...current, brand: { ...current.brand, custom: value } }))}
                canManage={canManage}
              />
              <CatalogInput
                label="Estado"
                selected={form.state.selected}
                custom={form.state.custom}
                options={stateOptions}
                onSelected={(value) => setForm((current) => ({ ...current, state: { ...current.state, selected: value } }))}
                onCustom={(value) => setForm((current) => ({ ...current, state: { ...current.state, custom: value } }))}
                canManage={canManage}
                required
              />
              <CatalogInput
                label="Condicion"
                selected={form.condition.selected}
                custom={form.condition.custom}
                options={conditionOptions}
                onSelected={(value) => setForm((current) => ({ ...current, condition: { ...current.condition, selected: value } }))}
                onCustom={(value) => setForm((current) => ({ ...current, condition: { ...current.condition, custom: value } }))}
                canManage={canManage}
                required
              />
              <TextInput
                label="Procesador"
                value={form.processor}
                onChange={(value) => setForm((current) => ({ ...current, processor: value }))}
                canManage={canManage}
                placeholder="Intel i5, Ryzen 7..."
              />
              <TextInput
                label="RAM"
                value={form.ram}
                onChange={(value) => setForm((current) => ({ ...current, ram: value }))}
                canManage={canManage}
                placeholder="16 GB"
              />
              <TextInput
                label="Almacenamiento"
                value={form.storage}
                onChange={(value) => setForm((current) => ({ ...current, storage: value }))}
                canManage={canManage}
                placeholder="512 GB SSD"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <TextInput
                label="Codigo"
                value={form.code}
                onChange={(value) => setForm((current) => ({ ...current, code: value }))}
                canManage={canManage}
                required
              />
              <TextInput
                label="Serial"
                value={form.serial}
                onChange={(value) => setForm((current) => ({ ...current, serial: value }))}
                canManage={canManage}
              />
              <TextInput
                label="Modelo"
                value={form.model}
                onChange={(value) => setForm((current) => ({ ...current, model: value }))}
                canManage={canManage}
              />
              <TextInput
                label="Color"
                value={form.color}
                onChange={(value) => setForm((current) => ({ ...current, color: value }))}
                canManage={canManage}
              />
              <TextInput
                label="Fecha compra"
                type="date"
                value={form.purchaseDate}
                onChange={(value) => setForm((current) => ({ ...current, purchaseDate: value }))}
                canManage={canManage}
              />
              <TextInput
                label="Costo estimado"
                type="number"
                step="0.01"
                value={form.estimatedCost}
                onChange={(value) => setForm((current) => ({ ...current, estimatedCost: value }))}
                canManage={canManage}
              />
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-200">Observaciones</span>
              <textarea
                value={form.notes}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                disabled={!canManage}
                rows={4}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-300/60 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>

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

      <EquipmentImagesDialog
        open={Boolean(imageTarget)}
        onClose={() => setImageTarget(null)}
        equipment={imageTarget}
      />
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  canManage,
  type = "text",
  step,
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  canManage: boolean;
  type?: string;
  step?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-200">
        {label}
        {required ? " *" : ""}
      </span>
      <input
        type={type}
        step={step}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={!canManage}
        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-300/60 disabled:cursor-not-allowed disabled:opacity-60"
      />
    </label>
  );
}

function CatalogInput({
  label,
  selected,
  custom,
  options,
  onSelected,
  onCustom,
  canManage,
  placeholder,
  required,
}: {
  label: string;
  selected: string;
  custom: string;
  options: string[];
  onSelected: (value: string) => void;
  onCustom: (value: string) => void;
  canManage: boolean;
  placeholder?: string;
  required?: boolean;
}) {
  const isCustom = selected === CUSTOM_VALUE;

  return (
    <div className="space-y-2">
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-200">
          {label}
          {required ? " *" : ""}
        </span>
        <select
          value={selected}
          onChange={(event) => onSelected(event.target.value)}
          disabled={!canManage}
          className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-300/60 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {placeholder ? <option value="">{placeholder}</option> : null}
          {options.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
          <option value={CUSTOM_VALUE}>Otro...</option>
        </select>
      </label>
      {isCustom ? (
        <input
          type="text"
          value={custom}
          onChange={(event) => onCustom(event.target.value)}
          disabled={!canManage}
          placeholder={`Nuevo ${label.toLowerCase()}`}
          className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-300/60 disabled:cursor-not-allowed disabled:opacity-60"
        />
      ) : null}
    </div>
  );
}
