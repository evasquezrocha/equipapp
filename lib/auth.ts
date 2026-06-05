import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AuthSession } from "@/lib/auth-types";
import { runQuery } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import sql from "mssql";

export const SESSION_COOKIE_NAME = "equipapp.session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 8;

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET no está configurado.");
  }
  return secret;
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

export function createSessionToken(session: AuthSession) {
  const payload = base64UrlEncode(JSON.stringify(session));
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function parseSessionToken(token: string | undefined): AuthSession | null {
  if (!token) {
    return null;
  }

  const [payload, signature] = token.split(".");
  if (!payload || !signature) {
    return null;
  }

  const expected = sign(payload);
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== signatureBuffer.length || !timingSafeEqual(expectedBuffer, signatureBuffer)) {
    return null;
  }

  try {
    const session = JSON.parse(base64UrlDecode(payload)) as AuthSession;
    if (session.expiresAt < Date.now()) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export async function getSessionFromCookies() {
  const cookieStore = await cookies();
  return parseSessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

export async function requireSession() {
  const session = await getSessionFromCookies();
  if (!session) {
    redirect("/login");
  }
  return session;
}

type DbUserRow = {
  id: number;
  nombre: string;
  email: string;
  password_hash: string;
  role_code: string;
  role_name: string;
  puede_ver_todo: boolean;
};

type DbCompanyRow = {
  empresa_id: number;
  nombre: string;
};

export async function authenticateWithPassword(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();

  const userResult = await runQuery<DbUserRow>(async (request) => {
    request.input("email", sql.NVarChar, normalizedEmail);
    return request.query<DbUserRow>(`
      SELECT TOP 1
        u.id,
        u.nombre,
        u.email,
        u.password_hash,
        r.codigo AS role_code,
        r.nombre AS role_name,
        r.puede_ver_todo
      FROM dbo.usuarios u
      INNER JOIN dbo.roles r ON r.id = u.rol_id
      WHERE u.email = @email
    `);
  });

  const user = userResult.recordset[0];
  if (!user || !verifyPassword(password, user.password_hash)) {
    return null;
  }

  const companyResult = await runQuery<DbCompanyRow>(async (request) => {
    request.input("userId", sql.Int, user.id);
    return request.query<DbCompanyRow>(`
      SELECT
        ue.empresa_id,
        e.nombre
      FROM dbo.usuario_empresas ue
      INNER JOIN dbo.empresas e ON e.id = ue.empresa_id
      WHERE ue.usuario_id = @userId
      ORDER BY e.nombre
    `);
  });

  const companyIds = companyResult.recordset.map((row) => row.empresa_id);
  const companyNames = companyResult.recordset.map((row) => row.nombre);

  if (!user.puede_ver_todo && companyIds.length === 0) {
    return null;
  }

  const session: AuthSession = {
    userId: user.id,
    name: user.nombre,
    email: user.email,
    roleCode: user.role_code,
    roleName: user.role_name,
    isAdmin: user.puede_ver_todo,
    companyIds,
    companyNames,
    expiresAt: Date.now() + SESSION_TTL_MS,
  };

  return session;
}

export function getAuthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}
