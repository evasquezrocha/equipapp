export type NavItem = {
  href: string;
  label: string;
  description: string;
  icon: string;
  adminOnly?: boolean;
};

export const NAV_ITEMS = [
  { href: "/", label: "Tablero", description: "Vista general", icon: "dashboard" },
  { href: "/empresas", label: "Empresas", description: "Tenants y usuarios", icon: "building" },
  { href: "/usuarios", label: "Usuarios", description: "Crear cuentas y accesos", icon: "user", adminOnly: true },
  { href: "/colaboradores", label: "Colaboradores", description: "Personas y equipos", icon: "people" },
  { href: "/equipos", label: "Equipos", description: "Inventario tecnologico", icon: "device" },
  { href: "/asignaciones", label: "Asignaciones", description: "Entrega por colaborador", icon: "assignment" },
] satisfies readonly NavItem[];
