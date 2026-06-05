"use client";

import { useState } from "react";

type ChangePasswordDialogProps = {
  open: boolean;
  onClose: () => void;
  targetUser?: {
    id: number;
    name: string;
    email: string;
  } | null;
};

function ChangePasswordDialogBody({
  onClose,
  targetUser,
}: {
  onClose: () => void;
  targetUser?: { id: number; name: string; email: string } | null;
}) {
  const isAdminChange = Boolean(targetUser);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const response = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetUserId: targetUser?.id ?? null,
        currentPassword: isAdminChange ? "" : currentPassword,
        newPassword,
        confirmPassword,
      }),
    });

    const payload = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;
    if (!response.ok) {
      setError(payload?.error ?? "No fue posible cambiar la contrasena.");
      setLoading(false);
      return;
    }

    setMessage(payload?.message ?? "Contrasena actualizada.");
    setLoading(false);
    window.setTimeout(() => {
      onClose();
      if (!isAdminChange) {
        window.location.href = "/login";
      }
    }, 700);
  }

  return (
    <div className="w-full max-w-lg rounded-[32px] border border-white/10 bg-slate-950/95 p-6 shadow-[0_35px_120px_-45px_rgba(15,23,42,0.9)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300/80">Seguridad</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {isAdminChange ? "Cambiar contraseña de usuario" : "Cambiar contraseña"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            {isAdminChange
              ? `Usuario objetivo: ${targetUser?.name} (${targetUser?.email})`
              : "Usa tu contraseña actual para definir una nueva clave."}
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
        {!isAdminChange ? (
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">Contraseña actual</span>
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-300/60"
              autoComplete="current-password"
            />
          </label>
        ) : null}

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-200">Nueva contraseña</span>
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-300/60"
            autoComplete="new-password"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-200">Confirmar contraseña</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-300/60"
            autoComplete="new-password"
          />
        </label>

        {error ? (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
            {message}
          </div>
        ) : null}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Guardando..." : "Actualizar"}
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
  );
}

export function ChangePasswordDialog({ open, onClose, targetUser }: ChangePasswordDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/75 px-4 py-6 backdrop-blur-sm">
      <ChangePasswordDialogBody onClose={onClose} targetUser={targetUser} />
    </div>
  );
}
