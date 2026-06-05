"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password, confirmPassword }),
    });

    const payload = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      setError(payload?.error ?? "No fue posible cambiar la contrasena.");
      setLoading(false);
      return;
    }

    setSuccess("Contrasena actualizada. Ya puedes iniciar sesion con la nueva clave.");
    setPassword("");
    setConfirmPassword("");
    setLoading(false);
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
      <section className="rounded-[32px] border border-white/10 bg-white/7 p-8 shadow-[0_35px_110px_-45px_rgba(15,23,42,0.95)] backdrop-blur-xl">
        <p className="text-sm uppercase tracking-[0.28em] text-cyan-300/80">Restablecimiento</p>
        <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-white md:text-5xl">
          Define una nueva contrasena.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
          Este enlace solo funciona una vez y expira automaticamente. Al guardar la nueva clave,
          las sesiones previas quedan invalidadas.
        </p>
      </section>

      <section className="rounded-[32px] border border-white/10 bg-slate-950/75 p-6 backdrop-blur-xl">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300/80">Nueva contrasena</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Cambiar clave</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            {token ? "Token valido detectado." : "Falta el token en la URL."}
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-200">Nueva contrasena</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60"
                placeholder="Minimo 8 caracteres"
                autoComplete="new-password"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-200">Confirmar contrasena</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60"
                placeholder="Repite la nueva contrasena"
                autoComplete="new-password"
              />
            </label>

            {error ? (
              <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                {success}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Guardando..." : "Actualizar contrasena"}
            </button>
          </form>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
            <Link href="/login" className="font-medium text-cyan-300 transition hover:text-cyan-200">
              Volver al login
            </Link>
            <span>Enlace de un solo uso</span>
          </div>
        </div>
      </section>
    </div>
  );
}
