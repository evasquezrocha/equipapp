import "server-only";

import { createHmac } from "node:crypto";
import sql from "mssql";
import { hashPassword } from "@/lib/password";
import { runQuery } from "@/lib/db";

const RESET_TOKEN_TTL_MS = 1000 * 60 * 60;

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET no está configurado.");
  }
  return secret;
}

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

function hasPasswordUpdatedAtColumn() {
  return runQuery<{ has_column: boolean }>(async (request) => {
    return request.query<{ has_column: boolean }>(`
      SELECT CASE WHEN COL_LENGTH('dbo.usuarios', 'password_updated_at') IS NULL THEN CAST(0 AS BIT) ELSE CAST(1 AS BIT) END AS has_column
    `);
  }).then((result) => Boolean(result.recordset[0]?.has_column));
}

type ResetTokenPayload = {
  userId: number;
  issuedAt: number;
  expiresAt: number;
  versionAtIssue: number;
};

async function getUserVersion(userId: number) {
  const hasColumn = await hasPasswordUpdatedAtColumn();
  const versionResult = await runQuery<{ version_at_issue: Date }>(async (request) => {
    request.input("userId", sql.Int, userId);
    const versionExpression = hasColumn ? "u.password_updated_at" : "u.updated_at";
    return request.query<{ version_at_issue: Date }>(`
      SELECT ${versionExpression} AS version_at_issue
      FROM dbo.usuarios u
      WHERE u.id = @userId AND u.activo = 1
    `);
  });

  const version = versionResult.recordset[0]?.version_at_issue;
  return version ? new Date(version).getTime() : null;
}

function buildToken(payload: ResetTokenPayload) {
  const encoded = encodeBase64Url(JSON.stringify(payload));
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

function parseToken(token: string) {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) {
    return null;
  }

  const expected = sign(encoded);
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== signatureBuffer.length || !expectedBuffer.equals(signatureBuffer)) {
    return null;
  }

  try {
    return JSON.parse(decodeBase64Url(encoded)) as ResetTokenPayload;
  } catch {
    return null;
  }
}

export async function createPasswordResetLink(email: string, baseUrl: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const userResult = await runQuery<{ id: number; nombre: string }>(async (request) => {
    request.input("email", sql.NVarChar, normalizedEmail);
    return request.query<{ id: number; nombre: string }>(`
      SELECT TOP 1 u.id, u.nombre
      FROM dbo.usuarios u
      WHERE u.email = @email AND u.activo = 1
    `);
  });

  const user = userResult.recordset[0];
  if (!user) {
    return null;
  }

  const versionAtIssue = (await getUserVersion(user.id)) ?? Date.now();
  const issuedAt = Date.now();
  const expiresAt = issuedAt + RESET_TOKEN_TTL_MS;
  const token = buildToken({
    userId: user.id,
    issuedAt,
    expiresAt,
    versionAtIssue,
  });

  return {
    token,
    resetUrl: `${baseUrl.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}`,
    expiresAt: new Date(expiresAt),
    name: user.nombre,
  };
}

export async function resetPasswordFromToken(token: string, newPassword: string) {
  const payload = parseToken(token);
  if (!payload) {
    return false;
  }

  if (payload.expiresAt <= Date.now()) {
    return false;
  }

  const currentVersion = await getUserVersion(payload.userId);
  if (!currentVersion || currentVersion !== payload.versionAtIssue) {
    return false;
  }

  const passwordHash = hashPassword(newPassword);
  const hasColumn = await hasPasswordUpdatedAtColumn();

  const result = await runQuery(async (request) => {
    request.input("userId", sql.Int, payload.userId);
    request.input("passwordHash", sql.NVarChar(255), passwordHash);

    const updateSql = hasColumn
      ? `
        UPDATE dbo.usuarios
        SET password_hash = @passwordHash,
            password_updated_at = SYSDATETIME(),
            updated_at = SYSDATETIME()
        WHERE id = @userId AND activo = 1;
      `
      : `
        UPDATE dbo.usuarios
        SET password_hash = @passwordHash,
            updated_at = SYSDATETIME()
        WHERE id = @userId AND activo = 1;
      `;

    return request.query(updateSql);
  });

  return result.rowsAffected[0] === 1;
}
