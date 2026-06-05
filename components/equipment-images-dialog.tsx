"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { EquipmentCrudRow } from "@/lib/catalog-types";

type EquipmentImagesDialogProps = {
  open: boolean;
  onClose: () => void;
  equipment: EquipmentCrudRow | null;
};

export function EquipmentImagesDialog({ open, onClose, equipment }: EquipmentImagesDialogProps) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const currentEquipment = equipment;
  const equipmentId = currentEquipment?.id ?? null;

  const fileNames = useMemo(() => files.map((file) => file.name), [files]);

  if (!open || !currentEquipment || !equipmentId) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (files.length === 0) {
      setMessage("Selecciona al menos una imagen.");
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));

      const response = await fetch(`/api/equipos/${equipmentId}/imagenes`, {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setMessage(payload?.error ?? "No fue posible subir las imagenes.");
        return;
      }

      setFiles([]);
      setMessage("Imagenes subidas correctamente.");
      router.refresh();
    } catch {
      setMessage("No fue posible subir las imagenes.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/75 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-[32px] border border-white/10 bg-slate-950/95 p-6 shadow-[0_35px_120px_-45px_rgba(15,23,42,0.9)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-300/80">Imagenes</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{currentEquipment.code}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {currentEquipment.typeName} · {currentEquipment.companyName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 hover:text-white"
          >
            Cerrar
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-6 text-center">
            <span className="block text-sm font-medium text-slate-200">Selecciona imagenes</span>
            <span className="mt-1 block text-xs text-slate-400">
              PNG, JPG, WEBP o HEIC. Puedes cargar varias a la vez.
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
              className="mt-4 w-full text-sm text-slate-300 file:mr-4 file:rounded-xl file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-950"
            />
          </label>

          {fileNames.length > 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
              <div className="font-medium text-white">Archivos seleccionados</div>
              <ul className="mt-2 space-y-1 text-slate-400">
                {fileNames.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {message ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
              {message}
            </div>
          ) : null}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Subiendo..." : "Subir imagenes"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-100"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
