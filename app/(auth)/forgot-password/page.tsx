"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setResetUrl(null);

    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const payload = (await response.json().catch(() => null)) as {
      message?: string;
      error?: string;
      resetUrl?: string | null;
    } | null;

    if (!response.ok) {
      setMessage(payload?.error ?? "No fue posible procesar la solicitud.");
      setLoading(false);
      return;
    }

    setMessage(payload?.message ?? "Solicitud enviada.");
    setResetUrl(payload?.resetUrl ?? null);
    setLoading(false);
  }

  return (
    <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
      <section className="rounded-[32px] border border-white/10 bg-white/7 p-8 shadow-[0_35px_110px_-45px_rgba(15,23,42,0.95)] backdrop-blur-xl">
        <p className="text-sm uppercase tracking-[0.28em] text-cyan-300/80">Recuperacion</p>
        <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-white md:text-5xl">
          Recupera el acceso a tu cuenta.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
          Genera un enlace de restablecimiento para el usuario asociado al correo ingresado.
          El enlace expira en una hora y deja sin efecto sesiones anteriores al cambiar la clave.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            "Token de un solo uso",
            "Vencimiento automatico",
            "Invalidacion de sesiones",
          ].map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-slate-950/45 p-4 text-sm text-slate-200">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[32px] border border-white/10 bg-slate-950/75 p-6 backdrop-blur-xl">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300/80">Olvide mi contrasena</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Solicitar enlace</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Ingresa el correo del usuario. Si existe, el sistema generara un enlace de recuperacion.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-200">Correo</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60"
                placeholder="evasquezrocha@gmail.com"
                autoComplete="email"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Generando..." : "Generar enlace"}
            </button>
          </form>

          {message ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
              {message}
            </div>
          ) : null}

          {resetUrl ? (
            <div className="mt-4 space-y-3 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3">
              <p className="text-sm font-medium text-cyan-100">Enlace de restablecimiento</p>
              <a
                href={resetUrl}
                className="break-all text-sm text-cyan-200 underline decoration-cyan-300/50 underline-offset-4"
              >
                {resetUrl}
              </a>
              <div>
                <a href={resetUrl} className="text-sm font-medium text-cyan-100 transition hover:text-white">
                  Abrir enlace
                </a>
              </div>
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
            <Link href="/login" className="font-medium text-cyan-300 transition hover:text-cyan-200">
              Volver al login
            </Link>
            <span>Requiere AUTH_SECRET configurado</span>
          </div>
        </div>
      </section>
    </div>
  );
}
