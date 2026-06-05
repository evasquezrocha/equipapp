import sql from "mssql";
import type { AuthSession } from "@/lib/auth-types";
import { runQuery } from "@/lib/db";
import { bindCompanyIds, buildTenantScope } from "@/lib/tenant-scope";

export type DashboardSummary = {
  companies: number;
  equipment: number;
  assigned: number;
  pendingMaintenance: number;
};

export type DashboardAssignment = {
  equipo: string;
  colaborador: string;
  empresa: string;
  fecha: string;
};

export type AssignmentRow = {
  id: number;
  equipmentCode: string;
  equipmentType: string;
  companyName: string;
  collaboratorId: number;
  collaboratorName: string;
  assignedBy: string;
  assignedAt: string;
  returnedAt: string | null;
  status: string;
  note: string | null;
};

export type CompanyRow = {
  id: number;
  name: string;
  taxId: string;
  contact: string | null;
  users: number;
  equipment: number;
  status: string;
};

export async function loadDashboardSummary(session: AuthSession) {
  const companiesScope = buildTenantScope(session, "e.id");
  const equipmentScope = buildTenantScope(session, "e.empresa_id");

  const summary = await runQuery<DashboardSummary>(async (request) => {
    bindCompanyIds(request, session);

    const result = await request.query<DashboardSummary>(`
      SELECT
        (SELECT COUNT(1) FROM dbo.empresas e WHERE ${companiesScope.clause}) AS companies,
        (SELECT COUNT(1) FROM dbo.equipos e WHERE ${equipmentScope.clause}) AS equipment,
        (SELECT COUNT(1) FROM dbo.asignaciones_equipos a WHERE ${buildTenantScope(session, "a.empresa_id").clause} AND a.estado = 'Activa') AS assigned,
        (SELECT COUNT(1) FROM dbo.mantenimientos m WHERE ${buildTenantScope(session, "m.empresa_id").clause} AND m.estado IN ('Pendiente', 'Programado')) AS pendingMaintenance
    `);

    return result;
  });

  return summary.recordset[0] ?? {
    companies: 0,
    equipment: 0,
    assigned: 0,
    pendingMaintenance: 0,
  };
}

export async function loadRecentAssignments(session: AuthSession, top = 5) {
  const scope = buildTenantScope(session, "a.empresa_id");

  const result = await runQuery<DashboardAssignment>(async (request) => {
    bindCompanyIds(request, session);
    request.input("top", sql.Int, top);
    return request.query<DashboardAssignment>(`
      SELECT TOP (@top)
        e.codigo_interno AS equipo,
        CONCAT(c.nombres, ' ', c.apellidos) AS colaborador,
        em.nombre AS empresa,
        CONVERT(varchar(10), a.fecha_asignacion, 23) AS fecha
      FROM dbo.asignaciones_equipos a
      INNER JOIN dbo.equipos e ON e.id = a.equipo_id
      INNER JOIN dbo.colaboradores c ON c.id = a.colaborador_id
      INNER JOIN dbo.empresas em ON em.id = a.empresa_id
      WHERE ${scope.clause}
      ORDER BY a.fecha_asignacion DESC
    `);
  });

  return result.recordset;
}

export async function loadAssignments(session: AuthSession, collaboratorId?: number | null) {
  const scope = buildTenantScope(session, "a.empresa_id");

  const result = await runQuery<AssignmentRow>(async (request) => {
    bindCompanyIds(request, session);
    if (collaboratorId && Number.isInteger(collaboratorId) && collaboratorId > 0) {
      request.input("collaboratorId", sql.Int, collaboratorId);
    }

    return request.query<AssignmentRow>(`
      SELECT
        a.id,
        e.codigo_interno AS equipmentCode,
        te.nombre AS equipmentType,
        em.nombre AS companyName,
        c.id AS collaboratorId,
        CONCAT(c.nombres, ' ', c.apellidos) AS collaboratorName,
        u.nombre AS assignedBy,
        CONVERT(varchar(19), a.fecha_asignacion, 120) AS assignedAt,
        CONVERT(varchar(19), a.fecha_devolucion, 120) AS returnedAt,
        a.estado AS status,
        a.observaciones AS note
      FROM dbo.asignaciones_equipos a
      INNER JOIN dbo.equipos e ON e.id = a.equipo_id
      INNER JOIN dbo.tipos_equipo te ON te.id = e.tipo_equipo_id
      INNER JOIN dbo.colaboradores c ON c.id = a.colaborador_id
      INNER JOIN dbo.empresas em ON em.id = a.empresa_id
      INNER JOIN dbo.usuarios u ON u.id = a.asignado_por_usuario_id
      WHERE ${scope.clause}
        ${collaboratorId && Number.isInteger(collaboratorId) && collaboratorId > 0 ? "AND a.colaborador_id = @collaboratorId" : ""}
      ORDER BY a.fecha_asignacion DESC, a.id DESC
    `);
  });

  return result.recordset;
}

export async function loadCompanies(session: AuthSession) {
  const scope = buildTenantScope(session, "e.id");

  const result = await runQuery<CompanyRow>(async (request) => {
    bindCompanyIds(request, session);
    return request.query<CompanyRow>(`
      SELECT
        e.id,
        e.nombre AS name,
        e.rut_o_id AS taxId,
        e.correo_contacto AS contact,
        (SELECT COUNT(1) FROM dbo.usuario_empresas ue WHERE ue.empresa_id = e.id) AS users,
        (SELECT COUNT(1) FROM dbo.equipos eq WHERE eq.empresa_id = e.id) AS equipment,
        CASE WHEN e.activa = 1 THEN 'Activa' ELSE 'Inactiva' END AS status
      FROM dbo.empresas e
      WHERE ${scope.clause}
      ORDER BY e.nombre
    `);
  });

  return result.recordset;
}
