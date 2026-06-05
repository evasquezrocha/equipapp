import "server-only";

import sql from "mssql";
import type { AuthSession } from "@/lib/auth-types";
import { runQuery } from "@/lib/db";
import { hashPassword } from "@/lib/password";

export type AdminRoleRow = {
  id: number;
  codigo: string;
  nombre: string;
  puede_ver_todo: boolean;
};

export type AdminUserRow = {
  id: number;
  name: string;
  email: string;
  roleId: number;
  roleName: string;
  roleCode: string;
  active: boolean;
  companyNames: string;
  companyIdsCsv: string;
  companyCount: number;
  createdAt: string;
  updatedAt: string;
  lastAccessAt: string | null;
};

export type AdminCompanyRow = {
  id: number;
  name: string;
};

export async function listRoles() {
  const result = await runQuery<AdminRoleRow>(async (request) => {
    return request.query<AdminRoleRow>(`
      SELECT id, codigo, nombre, puede_ver_todo
      FROM dbo.roles
      ORDER BY CASE WHEN codigo = 'admin' THEN 0 ELSE 1 END, nombre
    `);
  });

  return result.recordset;
}

export async function listAdminUsers(session: AuthSession) {
  if (!session.isAdmin) {
    throw new Error("FORBIDDEN");
  }

  const result = await runQuery<AdminUserRow>(async (request) => {
    return request.query<AdminUserRow>(`
      SELECT
        u.id,
        u.nombre AS name,
        u.email,
        u.rol_id AS roleId,
        r.nombre AS roleName,
        r.codigo AS roleCode,
        u.activo AS active,
        COALESCE((
          SELECT STRING_AGG(e.nombre, ', ')
          FROM dbo.usuario_empresas ue
          INNER JOIN dbo.empresas e ON e.id = ue.empresa_id
          WHERE ue.usuario_id = u.id
        ), '') AS companyNames,
        COALESCE((
          SELECT STRING_AGG(CONVERT(varchar(20), ue.empresa_id), ',')
          FROM dbo.usuario_empresas ue
          WHERE ue.usuario_id = u.id
        ), '') AS companyIdsCsv,
        (
          SELECT COUNT(1)
          FROM dbo.usuario_empresas ue
          WHERE ue.usuario_id = u.id
        ) AS companyCount,
        CONVERT(varchar(19), u.created_at, 120) AS createdAt,
        CONVERT(varchar(19), u.updated_at, 120) AS updatedAt,
        CONVERT(varchar(19), u.ultimo_acceso_at, 120) AS lastAccessAt
      FROM dbo.usuarios u
      INNER JOIN dbo.roles r ON r.id = u.rol_id
      ORDER BY u.nombre, u.email
    `);
  });

  return result.recordset;
}

export async function createAdminUser(
  session: AuthSession,
  input: {
    name: string;
    email: string;
    password: string;
    roleId: number;
    companyIds: number[];
  },
) {
  if (!session.isAdmin) {
    throw new Error("FORBIDDEN");
  }

  const passwordHash = hashPassword(input.password);
  const normalizedEmail = input.email.trim().toLowerCase();
  const companyIds = Array.from(new Set(input.companyIds.filter((value) => Number.isInteger(value) && value > 0)));
  const hasPasswordUpdatedAt = await runQuery<{ has_column: boolean }>(async (request) => {
    return request.query<{ has_column: boolean }>(`
      SELECT CASE WHEN COL_LENGTH('dbo.usuarios', 'password_updated_at') IS NULL THEN CAST(0 AS BIT) ELSE CAST(1 AS BIT) END AS has_column
    `);
  }).then((result) => Boolean(result.recordset[0]?.has_column));

  const result = await runQuery<{ id: number }>(async (request) => {
    request.input("name", sql.NVarChar, input.name.trim());
    request.input("email", sql.NVarChar, normalizedEmail);
    request.input("passwordHash", sql.NVarChar(255), passwordHash);
    request.input("roleId", sql.Int, input.roleId);
    request.input("companyIds", sql.NVarChar, companyIds.join(","));

    return request.query<{ id: number }>(`
      DECLARE @userId INT;

      ${hasPasswordUpdatedAt
        ? `INSERT INTO dbo.usuarios (rol_id, nombre, email, password_hash, password_updated_at, activo)
           VALUES (@roleId, @name, @email, @passwordHash, SYSDATETIME(), 1);`
        : `INSERT INTO dbo.usuarios (rol_id, nombre, email, password_hash, activo)
           VALUES (@roleId, @name, @email, @passwordHash, 1);`}

      SET @userId = CONVERT(INT, SCOPE_IDENTITY());

      IF LEN(@companyIds) > 0
      BEGIN
        INSERT INTO dbo.usuario_empresas (usuario_id, empresa_id, es_principal)
        SELECT @userId, TRY_CAST(value AS INT), 0
        FROM STRING_SPLIT(@companyIds, ',')
        WHERE TRY_CAST(value AS INT) IS NOT NULL;
      END

      SELECT @userId AS id;
    `);
  });

  return result.recordset[0] ?? null;
}

export async function updateAdminUser(
  session: AuthSession,
  input: {
    id: number;
    name: string;
    email: string;
    roleId: number;
    companyIds: number[];
  },
) {
  if (!session.isAdmin) {
    throw new Error("FORBIDDEN");
  }

  const companyIds = Array.from(new Set(input.companyIds.filter((value) => Number.isInteger(value) && value > 0)));

  await runQuery(async (request) => {
    request.input("id", sql.Int, input.id);
    request.input("name", sql.NVarChar, input.name.trim());
    request.input("email", sql.NVarChar, input.email.trim().toLowerCase());
    request.input("roleId", sql.Int, input.roleId);
    request.input("companyIds", sql.NVarChar, companyIds.join(","));

    return request.query(`
      UPDATE dbo.usuarios
      SET nombre = @name,
          email = @email,
          rol_id = @roleId,
          updated_at = SYSDATETIME()
      WHERE id = @id;

      DELETE FROM dbo.usuario_empresas
      WHERE usuario_id = @id;

      IF LEN(@companyIds) > 0
      BEGIN
        INSERT INTO dbo.usuario_empresas (usuario_id, empresa_id, es_principal)
        SELECT @id, TRY_CAST(value AS INT), 0
        FROM STRING_SPLIT(@companyIds, ',')
        WHERE TRY_CAST(value AS INT) IS NOT NULL;
      END
    `);
  });
}

export async function archiveAdminUser(session: AuthSession, userId: number) {
  if (!session.isAdmin) {
    throw new Error("FORBIDDEN");
  }
  if (session.userId === userId) {
    throw new Error("FORBIDDEN_SELF");
  }

  await runQuery(async (request) => {
    request.input("id", sql.Int, userId);
    return request.query(`
      UPDATE dbo.usuarios
      SET activo = 0,
          updated_at = SYSDATETIME()
      WHERE id = @id;
    `);
  });
}
