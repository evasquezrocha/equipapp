import { NextResponse } from "next/server";
import {
  archiveCollaborator,
  createCollaborator,
  listCollaborators,
  updateCollaborator,
} from "@/lib/catalog-data";
import { getApiSession, jsonError, parseNumericId } from "@/lib/api-helpers";

export const runtime = "nodejs";

export async function GET() {
  const session = await getApiSession();
  if (!session) {
    return jsonError("No autenticado.", 401);
  }

  try {
    const data = await listCollaborators(session);
    return NextResponse.json({ data });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Error al listar colaboradores.", 500);
  }
}

export async function POST(request: Request) {
  const session = await getApiSession();
  if (!session) {
    return jsonError("No autenticado.", 401);
  }

  const body = await request.json().catch(() => null);
  if (!body?.companyId || !body?.code || !body?.firstName || !body?.lastName) {
    return jsonError("Faltan datos obligatorios.", 400);
  }

  try {
    const created = await createCollaborator(session, {
      companyId: Number(body.companyId),
      code: String(body.code),
      firstName: String(body.firstName),
      lastName: String(body.lastName),
      email: body.email ? String(body.email) : undefined,
      cargo: body.cargo ? String(body.cargo) : undefined,
      phone: body.phone ? String(body.phone) : undefined,
    });
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al crear colaborador.";
    if (message === "FORBIDDEN") {
      return jsonError("Sin permisos para crear colaboradores en esta empresa.", 403);
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
  const companyId = Number(body?.companyId);
  if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(companyId) || companyId <= 0) {
    return jsonError("Datos inválidos.", 400);
  }

  try {
    await updateCollaborator(session, id, {
      companyId,
      code: String(body.code ?? ""),
      firstName: String(body.firstName ?? ""),
      lastName: String(body.lastName ?? ""),
      email: body.email ? String(body.email) : undefined,
      cargo: body.cargo ? String(body.cargo) : undefined,
      phone: body.phone ? String(body.phone) : undefined,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al actualizar colaborador.";
    if (message === "FORBIDDEN") {
      return jsonError("Sin permisos para editar este colaborador.", 403);
    }
    if (message === "NOT_FOUND") {
      return jsonError("Colaborador no encontrado.", 404);
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
    await archiveCollaborator(session, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al desactivar colaborador.";
    if (message === "FORBIDDEN") {
      return jsonError("Sin permisos para desactivar este colaborador.", 403);
    }
    if (message === "NOT_FOUND") {
      return jsonError("Colaborador no encontrado.", 404);
    }
    return jsonError(message, 500);
  }
}

