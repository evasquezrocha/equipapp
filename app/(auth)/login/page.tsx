"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const raw = await response.text().catch(() => "");
      let payload: { error?: string } | null = null;
      if (raw) {
        try {
          payload = JSON.parse(raw) as { error?: string };
        } catch {
          payload = { error: raw };
        }
      }
      setError(payload?.error ?? "No fue posible iniciar sesión.");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
      <section className="rounded-[32px] border border-white/10 bg-white/7 p-8 shadow-[0_35px_110px_-45px_rgba(15,23,42,0.95)] backdrop-blur-xl">
        <p className="text-sm uppercase tracking-[0.28em] text-cyan-300/80">Acceso seguro</p>
        <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-white md:text-5xl">
          Plataforma de control de equipos tecnologicos.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
          Inicia sesion para ver solo la informacion de tu empresa. El rol administrador
          conserva visibilidad transversal sobre todos los tenants.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            "Aislamiento por empresa",
            "Asignacion por colaborador",
            "Documentos y fotos en Dropbox",
          ].map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-slate-950/45 p-4 text-sm text-slate-200">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[32px] border border-white/10 bg-slate-950/75 p-6 backdrop-blur-xl">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300/80">Ingresar</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Bienvenido</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Usa el correo y la contraseña del usuario creado en SQL Server.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-200">Correo</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60"
                placeholder="usuario@empresa.cl"
                autoComplete="email"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-200">Contraseña</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60"
                placeholder="********"
                autoComplete="current-password"
              />
            </label>

            {error ? (
              <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Ingresando..." : "Entrar"}
            </button>
          </form>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
            <Link href="/forgot-password" className="font-medium text-cyan-300 transition hover:text-cyan-200">
              Olvidé mi contraseña
            </Link>
            <span>Protegido por sesion firmada</span>
          </div>
        </div>
      </section>
    </div>
  );
}
