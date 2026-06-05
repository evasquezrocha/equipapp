import { NextResponse } from "next/server";
import { getApiSession, jsonError } from "@/lib/api-helpers";
import { runQuery } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import sql from "mssql";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getApiSession();
  if (!session) {
    return jsonError("No autenticado.", 401);
  }

  const body = await request.json().catch(() => null);
  const targetUserId = body?.targetUserId ? Number(body.targetUserId) : null;
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";
  const confirmPassword = typeof body?.confirmPassword === "string" ? body.confirmPassword : "";

  if (!newPassword || !confirmPassword) {
    return jsonError("Completa todos los campos.", 400);
  }

  if (newPassword !== confirmPassword) {
    return jsonError("Las contraseñas nuevas no coinciden.", 400);
  }

  if (newPassword.length < 8) {
    return jsonError("La contraseña nueva debe tener al menos 8 caracteres.", 400);
  }

  const normalizedTargetUserId = Number.isInteger(targetUserId) ? targetUserId : null;
  const isAdminTargetChange = session.isAdmin && normalizedTargetUserId !== null && normalizedTargetUserId > 0;
  if (isAdminTargetChange && !session.isAdmin) {
    return jsonError("Sin permisos para cambiar la contraseña de otro usuario.", 403);
  }

  if (!isAdminTargetChange) {
    if (!currentPassword) {
      return jsonError("Debes indicar tu contraseña actual.", 400);
    }

    const userResult = await runQuery<{ password_hash: string }>(async (requestQuery) => {
      requestQuery.input("userId", sql.Int, session.userId);
      return requestQuery.query<{ password_hash: string }>(`
        SELECT u.password_hash
        FROM dbo.usuarios u
        WHERE u.id = @userId AND u.activo = 1
      `);
    });

    const user = userResult.recordset[0];
    if (!user || !verifyPassword(currentPassword, user.password_hash)) {
      return jsonError("La contraseña actual no es correcta.", 400);
    }
  }

  const result = await runQuery(async (requestQuery) => {
    requestQuery.input("userId", sql.Int, isAdminTargetChange ? normalizedTargetUserId : session.userId);
    requestQuery.input("passwordHash", sql.NVarChar(255), hashPassword(newPassword));

    const hasPasswordUpdatedAtResult = await requestQuery.query<{ has_column: boolean }>(`
      SELECT CASE WHEN COL_LENGTH('dbo.usuarios', 'password_updated_at') IS NULL THEN CAST(0 AS BIT) ELSE CAST(1 AS BIT) END AS has_column
    `);
    const hasPasswordUpdatedAt = Boolean(hasPasswordUpdatedAtResult.recordset[0]?.has_column);

    const updateSql = hasPasswordUpdatedAt
      ? `
        UPDATE dbo.usuarios
        SET password_hash = @passwordHash,
            password_updated_at = SYSDATETIME(),
            updated_at = SYSDATETIME()
        WHERE id = @userId;
      `
      : `
        UPDATE dbo.usuarios
        SET password_hash = @passwordHash,
            updated_at = SYSDATETIME()
        WHERE id = @userId;
      `;

    return requestQuery.query(updateSql);
  });

  if (result.rowsAffected[0] !== 1) {
    return jsonError("No fue posible actualizar la contraseña.", 500);
  }

  return NextResponse.json({
    ok: true,
    message: isAdminTargetChange
      ? "Contraseña actualizada para el usuario seleccionado."
      : "Contraseña actualizada. Debes iniciar sesión nuevamente.",
  });
}
