"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { AuthSession } from "@/lib/auth-types";
import { NAV_ITEMS } from "@/lib/navigation";
import {
  AssignmentIcon,
  BuildingIcon,
  DashboardIcon,
  DeviceIcon,
  DocumentIcon,
  MaintenanceIcon,
  PeopleIcon,
} from "@/components/nav-icons";

const STORAGE_KEY = "equipapp.sidebar.pinned";

const iconMap = {
  dashboard: DashboardIcon,
  building: BuildingIcon,
  people: PeopleIcon,
  device: DeviceIcon,
  assignment: AssignmentIcon,
  maintenance: MaintenanceIcon,
  document: DocumentIcon,
} as const;

function getLabel(pathname: string) {
  return NAV_ITEMS.find((item) => item.href === pathname || pathname.startsWith(`${item.href}/`))
    ?.label ?? "Tablero";
}

export function PortalShell({ children, session }: { children: ReactNode; session: AuthSession }) {
  const pathname = usePathname();
  const [pinned, setPinned] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  });
  const [hovered, setHovered] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, String(pinned));
  }, [pinned]);

  const expanded = pinned || hovered;
  const sidebarWidth = expanded ? 296 : 92;
  const currentLabel = useMemo(() => getLabel(pathname), [pathname]);
  const mainStyle = {
    "--sidebar-width": `${sidebarWidth}px`,
  } as CSSProperties;

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen">
      <aside
        className="fixed inset-y-0 left-0 z-40 hidden border-r border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.98)_0%,rgba(2,6,23,0.98)_100%)] shadow-[0_0_0_1px_rgba(148,163,184,0.06),8px_0_32px_rgba(2,6,23,0.45)] backdrop-blur-xl md:flex"
        style={{ width: sidebarWidth }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocusCapture={() => setHovered(true)}
        onBlurCapture={() => {
          if (!pinned) {
            setHovered(false);
          }
        }}
      >
        <div className="flex h-full w-full flex-col px-3 py-4">
          <div className="flex items-center justify-between gap-2 rounded-3xl border border-white/10 bg-white/[0.06] px-4 py-3 ring-1 ring-white/5">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-300/20 bg-gradient-to-br from-cyan-300/20 via-sky-400/15 to-emerald-300/15 text-sm font-semibold text-cyan-100 shadow-[0_10px_25px_rgba(14,165,233,0.12)]">
                EA
              </div>
              <div className={`transition-all duration-200 ${expanded ? "opacity-100" : "opacity-0"}`}>
                <div className="text-sm font-semibold text-white">EquipApp</div>
                <div className="text-xs text-slate-400">Control multiempresa</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPinned((value) => !value)}
              className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-slate-900/70 text-slate-100 shadow-sm transition hover:border-cyan-300/50 hover:bg-slate-800 hover:text-white"
              aria-label={pinned ? "Desfijar menu" : "Fijar menu"}
            >
              {pinned ? "▣" : "▢"}
            </button>
          </div>

          <nav className="mt-4 space-y-1">
            {NAV_ITEMS.map((item) => {
              const active =
                pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));
              const Icon = iconMap[item.icon];

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  aria-label={item.label}
                  className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
                    active
                      ? "bg-cyan-400/12 text-white ring-1 ring-cyan-300/30 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.12)]"
                      : "text-slate-300 hover:bg-white/6 hover:text-white"
                  }`}
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-100 transition group-hover:border-cyan-300/25 group-hover:bg-white/[0.08]">
                    <Icon className="h-6 w-6 drop-shadow-[0_0_8px_rgba(255,255,255,0.08)]" aria-hidden="true" />
                  </span>
                  <span
                    className={`min-w-0 overflow-hidden transition-all duration-200 ${
                      expanded ? "opacity-100" : "w-0 opacity-0"
                    }`}
                  >
                    <span className="block truncate font-medium">{item.label}</span>
                    <span className="block truncate text-xs text-slate-400">{item.description}</span>
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-3xl border border-white/10 bg-white/[0.05] p-4 text-sm text-slate-300 ring-1 ring-white/5">
            <p className={`font-medium text-white transition-all ${expanded ? "opacity-100" : "opacity-0"}`}>
              {session.name}
            </p>
            <p className={`mt-1 text-slate-400 transition-all ${expanded ? "opacity-100" : "opacity-0"}`}>
              {session.roleName} · {session.isAdmin ? "Acceso global" : `${session.companyNames.length} empresa(s)`}
            </p>
            <button
              type="button"
              onClick={handleLogout}
              className={`mt-4 rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200 transition hover:border-rose-300/40 hover:text-rose-100 ${
                expanded ? "opacity-100" : "opacity-0"
              }`}
            >
              Salir
            </button>
          </div>
        </div>
      </aside>

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-80 border-r border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.98)_0%,rgba(2,6,23,0.98)_100%)] p-4 shadow-[8px_0_32px_rgba(2,6,23,0.45)] backdrop-blur-xl transition-transform duration-300 md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3">
          <div>
            <div className="text-sm font-semibold text-white">EquipApp</div>
            <div className="text-xs text-slate-400">{session.roleName}</div>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-200"
          >
            Cerrar
          </button>
        </div>
        <nav className="mt-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));
            const Icon = iconMap[item.icon];

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                title={item.label}
                aria-label={item.label}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm ${
                  active
                    ? "bg-cyan-400/12 text-white ring-1 ring-cyan-300/25"
                    : "text-slate-300 hover:bg-white/6"
                }`}
              >
                <span className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-100">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-medium">{item.label}</span>
                  <span className="block text-xs text-slate-400">{item.description}</span>
                </span>
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-4 w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-semibold text-slate-100"
        >
          Cerrar sesion
        </button>
      </aside>

      {mobileOpen ? (
        <button
          type="button"
          aria-label="Cerrar menu lateral"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/70 md:hidden"
        />
      ) : null}

      <div className="min-h-screen transition-[padding] duration-300 md:pl-[var(--sidebar-width)] max-md:pl-0" style={mainStyle}>
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[linear-gradient(180deg,rgba(2,6,23,0.88)_0%,rgba(2,6,23,0.72)_100%)] px-4 py-4 backdrop-blur-xl md:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/5 text-slate-100 md:hidden"
                aria-label="Abrir menu lateral"
              >
                ☰
              </button>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/80">Portal</p>
                <h1 className="text-xl font-semibold text-white">{currentLabel}</h1>
              </div>
            </div>

            <div className="hidden items-center gap-3 md:flex">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                {session.name}
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                {session.isAdmin ? "Administrador global" : `Acceso a ${session.companyNames.length} empresa(s)`}
              </div>
              <button
                type="button"
                onClick={() => setPinned((value) => !value)}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-300/50 hover:text-white"
              >
                {pinned ? "Desfijar" : "Fijar"} menu
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-rose-300/50 hover:text-rose-100"
              >
                Salir
              </button>
            </div>
          </div>
        </header>

        <main className="px-4 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
