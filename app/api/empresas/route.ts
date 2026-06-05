import { NextResponse } from "next/server";
import {
  archiveCompany,
  createCompany,
  listCompanies,
  updateCompany,
} from "@/lib/catalog-data";
import { getApiSession, jsonError, parseNumericId } from "@/lib/api-helpers";

export const runtime = "nodejs";

export async function GET() {
  const session = await getApiSession();
  if (!session) {
    return jsonError("No autenticado.", 401);
  }

  try {
    const data = await listCompanies(session);
    return NextResponse.json({ data });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Error al listar empresas.", 500);
  }
}

export async function POST(request: Request) {
  const session = await getApiSession();
  if (!session) {
    return jsonError("No autenticado.", 401);
  }

  const body = await request.json().catch(() => null);
  if (!body?.name || !body?.taxId) {
    return jsonError("Faltan datos obligatorios.", 400);
  }

  try {
    const created = await createCompany(session, body);
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al crear empresa.";
    return jsonError(message === "FORBIDDEN" ? "Sin permisos para crear empresas." : message, message === "FORBIDDEN" ? 403 : 500);
  }
}

export async function PATCH(request: Request) {
  const session = await getApiSession();
  if (!session) {
    return jsonError("No autenticado.", 401);
  }

  const body = await request.json().catch(() => null);
  const id = Number(body?.id);
  if (!Number.isInteger(id) || id <= 0) {
    return jsonError("ID inválido.", 400);
  }

  try {
    await updateCompany(session, id, body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al actualizar empresa.";
    if (message === "FORBIDDEN") {
      return jsonError("Sin permisos para editar esta empresa.", 403);
    }
    if (message === "NOT_FOUND") {
      return jsonError("Empresa no encontrada.", 404);
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
  const id = parseNumericId(url.searchParams.get("id"));
  if (!id) {
    return jsonError("ID inválido.", 400);
  }

  try {
    await archiveCompany(session, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al desactivar empresa.";
    if (message === "FORBIDDEN") {
      return jsonError("Sin permisos para desactivar esta empresa.", 403);
    }
    if (message === "NOT_FOUND") {
      return jsonError("Empresa no encontrada.", 404);
    }
    return jsonError(message, 500);
  }
}

