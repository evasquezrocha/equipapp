export const dashboardMetrics = [
  { label: "Empresas activas", value: "8", delta: "+2 este trimestre" },
  { label: "Equipos registrados", value: "426", delta: "+31 este mes" },
  { label: "Asignados", value: "312", delta: "73% ocupación" },
  { label: "Mantenimientos pendientes", value: "18", delta: "Requieren revisión" },
] as const;

export const recentAssignments = [
  { equipo: "Notebook HP 840 G8", colaborador: "María Rojas", empresa: "Nortech Ltda.", fecha: "2026-06-03" },
  { equipo: "iPhone 13", colaborador: "Carlos Vega", empresa: "Nortech Ltda.", fecha: "2026-06-02" },
  { equipo: "Impresora Epson L5590", colaborador: "Soporte TI", empresa: "Andina Servicios", fecha: "2026-06-01" },
] as const;

export const dashboardAlerts = [
  "Los equipos en garantía vencen en 45 días. Prioriza revisión preventiva y respaldo documental en Dropbox.",
] as const;

export const statusBreakdown = [
  { label: "En uso", value: "312 equipos", percentage: 78 },
  { label: "Bodega", value: "74 equipos", percentage: 18 },
  { label: "Mantenimiento", value: "18 equipos", percentage: 4 },
] as const;

export const companies = [
  {
    id: 1,
    name: "Nortech Ltda.",
    taxId: "76.123.456-7",
    contact: "contacto@nortech.cl",
    users: 14,
    equipment: 172,
    status: "Activa",
  },
  {
    id: 2,
    name: "Andina Servicios",
    taxId: "96.987.654-3",
    contact: "mesa@andina.cl",
    users: 9,
    equipment: 88,
    status: "Activa",
  },
  {
    id: 3,
    name: "Grupo Delta",
    taxId: "77.555.333-1",
    contact: "soporte@delta.cl",
    users: 7,
    equipment: 54,
    status: "Activa",
  },
] as const;

export const equipmentCatalog = [
  {
    label: "Computadores",
    count: "214",
    note: "Portátiles y escritorios con control de serie y garantía.",
    items: [
      { code: "EQ-0001", type: "Notebook", company: "Nortech Ltda.", assignedTo: "María Rojas", status: "Asignado" },
      { code: "EQ-0002", type: "PC Escritorio", company: "Andina Servicios", assignedTo: "Bodega TI", status: "En bodega" },
    ],
  },
  {
    label: "Impresoras",
    count: "54",
    note: "Red, térmicas y multifuncionales.",
    items: [
      { code: "PR-0012", type: "Multifuncional", company: "Andina Servicios", assignedTo: "Soporte TI", status: "En uso" },
    ],
  },
  {
    label: "Celulares",
    count: "106",
    note: "Con evidencia fotográfica y estado de entrega.",
    items: [
      { code: "CL-0104", type: "Smartphone", company: "Nortech Ltda.", assignedTo: "Carlos Vega", status: "Asignado" },
    ],
  },
  {
    label: "Tablets",
    count: "52",
    note: "Equipos móviles con asignación por colaborador.",
    items: [
      { code: "TB-0008", type: "Tablet", company: "Grupo Delta", assignedTo: "Comercial", status: "En revisión" },
    ],
  },
] as const;

export const assignments = [
  {
    equipment: "Notebook Lenovo ThinkPad",
    company: "Nortech Ltda.",
    assignedTo: "María Rojas",
    assignedAt: "2026-06-01",
    deliveredBy: "Laura Silva",
    status: "Vigente",
    note: "Incluye cargador y bolsa de transporte.",
  },
  {
    equipment: "Celular Samsung A54",
    company: "Grupo Delta",
    assignedTo: "Javier Soto",
    assignedAt: "2026-05-29",
    deliveredBy: "Mesa TI",
    status: "Vigente",
    note: "Pin de desbloqueo entregado por canal seguro.",
  },
] as const;

export const documents = [
  {
    name: "Acta de entrega EQ-0001",
    company: "Nortech Ltda.",
    type: "PDF",
    equipment: "Notebook Lenovo ThinkPad",
    path: "/EquipApp/Nortech Ltda./equipos/EQ-0001/documentos/acta-entrega.pdf",
  },
  {
    name: "Foto frontal PR-0012",
    company: "Andina Servicios",
    type: "Imagen",
    equipment: "Multifuncional Epson",
    path: "/EquipApp/Andina Servicios/equipos/PR-0012/fotos/frontal.jpg",
  },
] as const;

export const maintenanceTasks = [
  {
    equipment: "Notebook Lenovo ThinkPad",
    type: "Preventivo",
    company: "Nortech Ltda.",
    date: "2026-06-10",
    status: "Programado",
  },
  {
    equipment: "Impresora Epson L5590",
    type: "Correctivo",
    company: "Andina Servicios",
    date: "2026-06-08",
    status: "Pendiente de repuestos",
  },
] as const;
