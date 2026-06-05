import { NextResponse } from "next/server";
import {
  archiveEquipment,
  createEquipment,
  listEquipment,
  updateEquipment,
} from "@/lib/catalog-data";
import { getApiSession, jsonError, parseNumericId } from "@/lib/api-helpers";

export const runtime = "nodejs";

export async function GET() {
  const session = await getApiSession();
  if (!session) {
    return jsonError("No autenticado.", 401);
  }

  try {
    const data = await listEquipment(session);
    return NextResponse.json({ data });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Error al listar equipos.", 500);
  }
}

export async function POST(request: Request) {
  const session = await getApiSession();
  if (!session) {
    return jsonError("No autenticado.", 401);
  }

  const body = await request.json().catch(() => null);
  if (!body?.companyId || !body?.typeName || !body?.code) {
    return jsonError("Faltan datos obligatorios.", 400);
  }

  try {
    const created = await createEquipment(session, {
      companyId: Number(body.companyId),
      typeName: String(body.typeName),
      code: String(body.code),
      serial: body.serial ? String(body.serial) : undefined,
      brand: body.brand ? String(body.brand) : undefined,
      model: body.model ? String(body.model) : undefined,
      color: body.color ? String(body.color) : undefined,
      processor: body.processor ? String(body.processor) : undefined,
      ram: body.ram ? String(body.ram) : undefined,
      storage: body.storage ? String(body.storage) : undefined,
      state: body.state ? String(body.state) : undefined,
      condition: body.condition ? String(body.condition) : undefined,
      collaboratorId: body.collaboratorId ? Number(body.collaboratorId) : null,
      purchaseDate: body.purchaseDate ? String(body.purchaseDate) : undefined,
      estimatedCost: body.estimatedCost ? Number(body.estimatedCost) : null,
      notes: body.notes ? String(body.notes) : undefined,
    });
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al crear equipo.";
    if (message === "FORBIDDEN") {
      return jsonError("Sin permisos para crear equipos en esta empresa.", 403);
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
    await updateEquipment(session, id, {
      companyId,
      typeName: String(body.typeName ?? ""),
      code: String(body.code ?? ""),
      serial: body.serial ? String(body.serial) : undefined,
      brand: body.brand ? String(body.brand) : undefined,
      model: body.model ? String(body.model) : undefined,
      color: body.color ? String(body.color) : undefined,
      processor: body.processor ? String(body.processor) : undefined,
      ram: body.ram ? String(body.ram) : undefined,
      storage: body.storage ? String(body.storage) : undefined,
      state: body.state ? String(body.state) : undefined,
      condition: body.condition ? String(body.condition) : undefined,
      collaboratorId: body.collaboratorId ? Number(body.collaboratorId) : null,
      purchaseDate: body.purchaseDate ? String(body.purchaseDate) : undefined,
      estimatedCost: body.estimatedCost ? Number(body.estimatedCost) : null,
      notes: body.notes ? String(body.notes) : undefined,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al actualizar equipo.";
    if (message === "FORBIDDEN") {
      return jsonError("Sin permisos para editar este equipo.", 403);
    }
    if (message === "NOT_FOUND") {
      return jsonError("Equipo no encontrado.", 404);
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
    await archiveEquipment(session, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al dar de baja equipo.";
    if (message === "FORBIDDEN") {
      return jsonError("Sin permisos para dar de baja este equipo.", 403);
    }
    if (message === "NOT_FOUND") {
      return jsonError("Equipo no encontrado.", 404);
    }
    return jsonError(message, 500);
  }
}
