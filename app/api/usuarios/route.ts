import { NextResponse } from "next/server";
import { getApiSession, jsonError } from "@/lib/api-helpers";
import { archiveAdminUser, createAdminUser, listAdminUsers, updateAdminUser } from "@/lib/user-admin-data";

export const runtime = "nodejs";

export async function GET() {
  const session = await getApiSession();
  if (!session) {
    return jsonError("No autenticado.", 401);
  }

  try {
    const data = await listAdminUsers(session);
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al listar usuarios.";
    return jsonError(message === "FORBIDDEN" ? "Sin permisos para ver usuarios." : message, message === "FORBIDDEN" ? 403 : 500);
  }
}

export async function POST(request: Request) {
  const session = await getApiSession();
  if (!session) {
    return jsonError("No autenticado.", 401);
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name : "";
  const email = typeof body?.email === "string" ? body.email : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const roleId = Number(body?.roleId);
  const companyIds = Array.isArray(body?.companyIds) ? body.companyIds.map((value: unknown) => Number(value)) : [];

  if (!name || !email || !password || !Number.isInteger(roleId) || roleId <= 0) {
    return jsonError("Faltan datos obligatorios.", 400);
  }

  try {
    const created = await createAdminUser(session, {
      name,
      email,
      password,
      roleId,
      companyIds,
    });
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al crear usuario.";
    if (message === "FORBIDDEN") {
      return jsonError("Sin permisos para crear usuarios.", 403);
    }
    return jsonError(message, 500);
  }
}

export async function PATCH(request: Request) {
  const session = await getApiSession();
  if (!session) {
    return jsonError("No autenticado.", 401);
  }

  const body = await request.json().catch(() => null);
  const id = Number(body?.id);
  const name = typeof body?.name === "string" ? body.name : "";
  const email = typeof body?.email === "string" ? body.email : "";
  const roleId = Number(body?.roleId);
  const companyIds = Array.isArray(body?.companyIds) ? body.companyIds.map((value: unknown) => Number(value)) : [];

  if (!Number.isInteger(id) || id <= 0 || !name || !email || !Number.isInteger(roleId) || roleId <= 0) {
    return jsonError("Datos inválidos.", 400);
  }

  try {
    await updateAdminUser(session, {
      id,
      name,
      email,
      roleId,
      companyIds,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al actualizar usuario.";
    if (message === "FORBIDDEN") {
      return jsonError("Sin permisos para editar usuarios.", 403);
    }
    return jsonError(message, 500);
  }
}

export async function DELETE(request: Request) {
  const session = await getApiSession();
  if (!session) {
    return jsonError("No autenticado.", 401);
  }

  const url = new URL(request.url);
  const id = Number(url.searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return jsonError("ID inválido.", 400);
  }

  try {
    await archiveAdminUser(session, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al desactivar usuario.";
    if (message === "FORBIDDEN") {
      return jsonError("Sin permisos para desactivar usuarios.", 403);
    }
    if (message === "FORBIDDEN_SELF") {
      return jsonError("No puedes desactivar tu propio usuario.", 400);
    }
    return jsonError(message, 500);
  }
}
