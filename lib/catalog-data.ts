import "server-only";

import sql from "mssql";
import type { AuthSession } from "@/lib/auth-types";
import type {
  CollaboratorCrudRow,
  CollaboratorInput,
  CollaboratorSelectRow,
  CompanyCrudRow,
  CompanyInput,
  CompanySelectRow,
  EquipmentCrudRow,
  EquipmentInput,
} from "@/lib/catalog-types";
import { runQuery } from "@/lib/db";
import { bindCompanyIds, canAccessCompany, requireCompanyAccess, buildTenantScope } from "@/lib/tenant-scope";

async function resolveTypeId(request: sql.Request, typeName: string) {
  request.input("typeName", sql.NVarChar, typeName.trim());
  const result = await request.query<{ id: number }>(`
    DECLARE @tipoId INT;

    SELECT @tipoId = id
    FROM dbo.tipos_equipo
    WHERE nombre = @typeName;

    IF @tipoId IS NULL
    BEGIN
      INSERT INTO dbo.tipos_equipo (nombre, activo)
      VALUES (@typeName, 1);
      SET @tipoId = CONVERT(INT, SCOPE_IDENTITY());
    END

    SELECT @tipoId AS id;
  `);

  return result.recordset[0]?.id ?? null;
}

export async function listCompanies(session: AuthSession) {
  const scope = buildTenantScope(session, "e.id");
  const result = await runQuery<CompanyCrudRow>(async (request) => {
    bindCompanyIds(request, session);
    return request.query<CompanyCrudRow>(`
      SELECT
        e.id,
        e.nombre AS name,
        e.rut_o_id AS taxId,
        e.dominio AS domain,
        e.contacto_principal AS contactPerson,
        e.correo_contacto AS contactEmail,
        e.telefono AS phone,
        e.activa AS active,
        (SELECT COUNT(1) FROM dbo.usuario_empresas ue WHERE ue.empresa_id = e.id) AS users,
        (SELECT COUNT(1) FROM dbo.equipos eq WHERE eq.empresa_id = e.id) AS equipment
      FROM dbo.empresas e
      WHERE ${scope.clause}
      ORDER BY e.nombre
    `);
  });

  return result.recordset;
}

export async function createCompany(session: AuthSession, input: CompanyInput) {
  if (!session.isAdmin) {
    throw new Error("FORBIDDEN");
  }

  const result = await runQuery<{ id: number }>(async (request) => {
    request.input("name", sql.NVarChar, input.name.trim());
    request.input("taxId", sql.NVarChar, input.taxId.trim());
    request.input("domain", sql.NVarChar, input.domain?.trim() || null);
    request.input("contactPerson", sql.NVarChar, input.contactPerson?.trim() || null);
    request.input("contactEmail", sql.NVarChar, input.contactEmail?.trim() || null);
    request.input("phone", sql.NVarChar, input.phone?.trim() || null);

    return request.query<{ id: number }>(`
      INSERT INTO dbo.empresas (nombre, rut_o_id, dominio, contacto_principal, correo_contacto, telefono, activa)
      OUTPUT INSERTED.id AS id
      VALUES (@name, @taxId, @domain, @contactPerson, @contactEmail, @phone, 1);
    `);
  });

  return result.recordset[0] ?? null;
}

export async function updateCompany(session: AuthSession, companyId: number, input: CompanyInput) {
  requireCompanyAccess(session, companyId);

  await runQuery(async (request) => {
    request.input("id", sql.Int, companyId);
    request.input("name", sql.NVarChar, input.name.trim());
    request.input("taxId", sql.NVarChar, input.taxId.trim());
    request.input("domain", sql.NVarChar, input.domain?.trim() || null);
    request.input("contactPerson", sql.NVarChar, input.contactPerson?.trim() || null);
    request.input("contactEmail", sql.NVarChar, input.contactEmail?.trim() || null);
    request.input("phone", sql.NVarChar, input.phone?.trim() || null);

    return request.query(`
      UPDATE dbo.empresas
      SET nombre = @name,
          rut_o_id = @taxId,
          dominio = @domain,
          contacto_principal = @contactPerson,
          correo_contacto = @contactEmail,
          telefono = @phone,
          updated_at = SYSDATETIME()
      WHERE id = @id;
    `);
  });
}

export async function archiveCompany(session: AuthSession, companyId: number) {
  requireCompanyAccess(session, companyId);

  await runQuery(async (request) => {
    request.input("id", sql.Int, companyId);
    return request.query(`
      UPDATE dbo.empresas
      SET activa = 0,
          updated_at = SYSDATETIME()
      WHERE id = @id;
    `);
  });
}

export async function listCompanySelect(session: AuthSession) {
  const scope = buildTenantScope(session, "e.id");
  const result = await runQuery<CompanySelectRow>(async (request) => {
    bindCompanyIds(request, session);
    return request.query<CompanySelectRow>(`
      SELECT e.id, e.nombre AS name
      FROM dbo.empresas e
      WHERE ${scope.clause} AND e.activa = 1
      ORDER BY e.nombre
    `);
  });

  return result.recordset;
}

export async function listCollaborators(session: AuthSession) {
  const scope = buildTenantScope(session, "c.empresa_id");
  const result = await runQuery<CollaboratorCrudRow>(async (request) => {
    bindCompanyIds(request, session);
    return request.query<CollaboratorCrudRow>(`
      SELECT
        c.id,
        c.empresa_id AS companyId,
        e.nombre AS companyName,
        c.codigo_colaborador AS code,
        c.nombres AS firstName,
        c.apellidos AS lastName,
        CONCAT(c.nombres, ' ', c.apellidos) AS fullName,
        c.email,
        c.cargo,
        c.telefono AS phone,
        c.activo AS active,
        (SELECT COUNT(1) FROM dbo.equipos eq WHERE eq.colaborador_id = c.id) AS equipmentCount
      FROM dbo.colaboradores c
      INNER JOIN dbo.empresas e ON e.id = c.empresa_id
      WHERE ${scope.clause}
      ORDER BY e.nombre, c.nombres, c.apellidos
    `);
  });

  return result.recordset;
}

export async function createCollaborator(session: AuthSession, input: CollaboratorInput) {
  requireCompanyAccess(session, input.companyId);

  const result = await runQuery<{ id: number }>(async (request) => {
    request.input("companyId", sql.Int, input.companyId);
    request.input("code", sql.NVarChar, input.code.trim());
    request.input("firstName", sql.NVarChar, input.firstName.trim());
    request.input("lastName", sql.NVarChar, input.lastName.trim());
    request.input("email", sql.NVarChar, input.email?.trim() || null);
    request.input("cargo", sql.NVarChar, input.cargo?.trim() || null);
    request.input("phone", sql.NVarChar, input.phone?.trim() || null);

    return request.query<{ id: number }>(`
      INSERT INTO dbo.colaboradores (empresa_id, codigo_colaborador, nombres, apellidos, email, cargo, telefono, activo)
      OUTPUT INSERTED.id AS id
      VALUES (@companyId, @code, @firstName, @lastName, @email, @cargo, @phone, 1);
    `);
  });

  return result.recordset[0] ?? null;
}

export async function updateCollaborator(session: AuthSession, collaboratorId: number, input: CollaboratorInput) {
  requireCompanyAccess(session, input.companyId);

  await runQuery(async (request) => {
    request.input("id", sql.Int, collaboratorId);
    request.input("companyId", sql.Int, input.companyId);
    request.input("code", sql.NVarChar, input.code.trim());
    request.input("firstName", sql.NVarChar, input.firstName.trim());
    request.input("lastName", sql.NVarChar, input.lastName.trim());
    request.input("email", sql.NVarChar, input.email?.trim() || null);
    request.input("cargo", sql.NVarChar, input.cargo?.trim() || null);
    request.input("phone", sql.NVarChar, input.phone?.trim() || null);

    return request.query(`
      UPDATE dbo.colaboradores
      SET empresa_id = @companyId,
          codigo_colaborador = @code,
          nombres = @firstName,
          apellidos = @lastName,
          email = @email,
          cargo = @cargo,
          telefono = @phone,
          updated_at = SYSDATETIME()
      WHERE id = @id;
    `);
  });
}

export async function archiveCollaborator(session: AuthSession, collaboratorId: number) {
  const current = await runQuery<{ empresa_id: number }>(async (request) => {
    request.input("id", sql.Int, collaboratorId);
    return request.query<{ empresa_id: number }>(`
      SELECT empresa_id
      FROM dbo.colaboradores
      WHERE id = @id
    `);
  });

  const companyId = current.recordset[0]?.empresa_id;
  if (!companyId) {
    throw new Error("NOT_FOUND");
  }
  requireCompanyAccess(session, companyId);

  await runQuery(async (request) => {
    request.input("id", sql.Int, collaboratorId);
    return request.query(`
      UPDATE dbo.colaboradores
      SET activo = 0,
          updated_at = SYSDATETIME()
      WHERE id = @id;
    `);
  });
}

export async function listCollaboratorSelect(session: AuthSession) {
  const scope = buildTenantScope(session, "c.empresa_id");
  const result = await runQuery<CollaboratorSelectRow>(async (request) => {
    bindCompanyIds(request, session);
    return request.query<CollaboratorSelectRow>(`
      SELECT
        c.id,
        c.empresa_id AS companyId,
        CONCAT(c.nombres, ' ', c.apellidos, ' (', c.codigo_colaborador, ')') AS name
      FROM dbo.colaboradores c
      WHERE ${scope.clause} AND c.activo = 1
      ORDER BY name
    `);
  });

  return result.recordset;
}

export async function listEquipment(session: AuthSession) {
  const scope = buildTenantScope(session, "e.empresa_id");
  const result = await runQuery<EquipmentCrudRow>(async (request) => {
    bindCompanyIds(request, session);
    return request.query<EquipmentCrudRow>(`
      SELECT
        e.id,
        e.empresa_id AS companyId,
        em.nombre AS companyName,
        te.nombre AS typeName,
        e.codigo_interno AS code,
        e.serial,
        e.marca AS brand,
        e.modelo AS model,
        e.color,
        e.estado AS state,
        e.condicion AS condition,
        e.propiedad AS ownership,
        e.colaborador_id AS collaboratorId,
        CONCAT(c.nombres, ' ', c.apellidos) AS collaboratorName,
        CONVERT(varchar(10), e.fecha_compra, 23) AS purchaseDate,
        e.costo_estimado AS estimatedCost,
        e.observaciones AS notes
      FROM dbo.equipos e
      INNER JOIN dbo.empresas em ON em.id = e.empresa_id
      INNER JOIN dbo.tipos_equipo te ON te.id = e.tipo_equipo_id
      LEFT JOIN dbo.colaboradores c ON c.id = e.colaborador_id
      WHERE ${scope.clause}
      ORDER BY em.nombre, e.codigo_interno
    `);
  });

  return result.recordset;
}

export async function createEquipment(session: AuthSession, input: EquipmentInput) {
  requireCompanyAccess(session, input.companyId);

  const result = await runQuery<{ id: number }>(async (request) => {
    request.input("companyId", sql.Int, input.companyId);
    request.input("typeName", sql.NVarChar, input.typeName.trim());
    request.input("code", sql.NVarChar, input.code.trim());
    request.input("serial", sql.NVarChar, input.serial?.trim() || null);
    request.input("brand", sql.NVarChar, input.brand?.trim() || null);
    request.input("model", sql.NVarChar, input.model?.trim() || null);
    request.input("color", sql.NVarChar, input.color?.trim() || null);
    request.input("state", sql.NVarChar, input.state?.trim() || "Disponible");
    request.input("condition", sql.NVarChar, input.condition?.trim() || "Operativo");
    request.input("ownership", sql.NVarChar, input.ownership?.trim() || "Propio");
    request.input("collaboratorId", sql.Int, input.collaboratorId ?? null);
    request.input("purchaseDate", sql.Date, input.purchaseDate ? new Date(input.purchaseDate) : null);
    request.input("estimatedCost", sql.Decimal(18, 2), input.estimatedCost ?? null);
    request.input("notes", sql.NVarChar, input.notes?.trim() || null);

    const typeId = await resolveTypeId(request, input.typeName);
    if (!typeId) {
      throw new Error("TYPE_NOT_FOUND");
    }

    request.input("typeId", sql.Int, typeId);

    return request.query<{ id: number }>(`
      INSERT INTO dbo.equipos (
        empresa_id, tipo_equipo_id, colaborador_id, codigo_interno, serial, marca, modelo, color,
        estado, condicion, propiedad, fecha_compra, costo_estimado, observaciones
      )
      OUTPUT INSERTED.id AS id
      VALUES (
        @companyId, @typeId, @collaboratorId, @code, @serial, @brand, @model, @color,
        @state, @condition, @ownership, @purchaseDate, @estimatedCost, @notes
      );
    `);
  });

  return result.recordset[0] ?? null;
}

export async function updateEquipment(session: AuthSession, equipmentId: number, input: EquipmentInput) {
  requireCompanyAccess(session, input.companyId);

  await runQuery(async (request) => {
    request.input("id", sql.Int, equipmentId);
    request.input("companyId", sql.Int, input.companyId);
    request.input("typeName", sql.NVarChar, input.typeName.trim());
    request.input("code", sql.NVarChar, input.code.trim());
    request.input("serial", sql.NVarChar, input.serial?.trim() || null);
    request.input("brand", sql.NVarChar, input.brand?.trim() || null);
    request.input("model", sql.NVarChar, input.model?.trim() || null);
    request.input("color", sql.NVarChar, input.color?.trim() || null);
    request.input("state", sql.NVarChar, input.state?.trim() || "Disponible");
    request.input("condition", sql.NVarChar, input.condition?.trim() || "Operativo");
    request.input("ownership", sql.NVarChar, input.ownership?.trim() || "Propio");
    request.input("collaboratorId", sql.Int, input.collaboratorId ?? null);
    request.input("purchaseDate", sql.Date, input.purchaseDate ? new Date(input.purchaseDate) : null);
    request.input("estimatedCost", sql.Decimal(18, 2), input.estimatedCost ?? null);
    request.input("notes", sql.NVarChar, input.notes?.trim() || null);

    const typeId = await resolveTypeId(request, input.typeName);
    if (!typeId) {
      throw new Error("TYPE_NOT_FOUND");
    }

    request.input("typeId", sql.Int, typeId);

    return request.query(`
      UPDATE dbo.equipos
      SET empresa_id = @companyId,
          tipo_equipo_id = @typeId,
          colaborador_id = @collaboratorId,
          codigo_interno = @code,
          serial = @serial,
          marca = @brand,
          modelo = @model,
          color = @color,
          estado = @state,
          condicion = @condition,
          propiedad = @ownership,
          fecha_compra = @purchaseDate,
          costo_estimado = @estimatedCost,
          observaciones = @notes,
          updated_at = SYSDATETIME()
      WHERE id = @id;
    `);
  });
}

export async function archiveEquipment(session: AuthSession, equipmentId: number) {
  const current = await runQuery<{ empresa_id: number }>(async (request) => {
    request.input("id", sql.Int, equipmentId);
    return request.query<{ empresa_id: number }>(`
      SELECT empresa_id
      FROM dbo.equipos
      WHERE id = @id
    `);
  });

  const companyId = current.recordset[0]?.empresa_id;
  if (!companyId) {
    throw new Error("NOT_FOUND");
  }
  requireCompanyAccess(session, companyId);

  await runQuery(async (request) => {
    request.input("id", sql.Int, equipmentId);
    return request.query(`
      UPDATE dbo.equipos
      SET estado = 'Baja',
          condicion = 'Retirado',
          colaborador_id = NULL,
          updated_at = SYSDATETIME()
      WHERE id = @id;
    `);
  });
}

export async function listEquipmentSelects(session: AuthSession) {
  return {
    companies: await listCompanySelect(session),
    collaborators: await listCollaboratorSelect(session),
  };
}

export function canEditCompany(session: AuthSession, companyId: number) {
  return canAccessCompany(session, companyId);
}
