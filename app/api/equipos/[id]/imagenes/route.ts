import { NextResponse } from "next/server";
import { getApiSession, jsonError } from "@/lib/api-helpers";
import { runQuery } from "@/lib/db";
import { ensureDropboxFolder, uploadDropboxFile } from "@/lib/dropbox";
import { buildDropboxPhotoPath, buildDropboxEquipmentRoot } from "@/lib/dropbox-paths";
import sql from "mssql";

export const runtime = "nodejs";

function isImageFile(file: File) {
  return file.type.startsWith("image/");
}

export async function POST(request: Request, context: RouteContext<"/api/equipos/[id]/imagenes">) {
  const session = await getApiSession();
  if (!session) {
    return jsonError("No autenticado.", 401);
  }

  const { id } = await context.params;
  const equipmentId = Number(id);
  if (!Number.isInteger(equipmentId) || equipmentId <= 0) {
    return jsonError("ID inválido.", 400);
  }

  const formData = await request.formData();
  const files = formData
    .getAll("files")
    .filter((item): item is File => item instanceof File && item.size > 0);

  if (files.length === 0) {
    return jsonError("Debes seleccionar al menos una imagen.", 400);
  }

  const equipmentResult = await runQuery<{ companyName: string; code: string; companyId: number }>(async (query) => {
    query.input("id", sql.Int, equipmentId);
    return query.query<{ companyName: string; code: string; companyId: number }>(`
      SELECT e.codigo_interno AS code, em.nombre AS companyName, e.empresa_id AS companyId
      FROM dbo.equipos e
      INNER JOIN dbo.empresas em ON em.id = e.empresa_id
      WHERE e.id = @id
    `);
  });

  const equipment = equipmentResult.recordset[0];
  if (!equipment) {
    return jsonError("Equipo no encontrado.", 404);
  }

  if (!session.isAdmin && !session.companyIds.includes(equipment.companyId)) {
    return jsonError("Sin permisos para cargar imagenes en este equipo.", 403);
  }

  const folder = `${buildDropboxEquipmentRoot(equipment.companyName, equipment.code)}/fotos`;
  await ensureDropboxFolder(folder);

  const uploaded: Array<{ name: string; path: string; id: string }> = [];

  for (const file of files) {
    if (!isImageFile(file)) {
      return jsonError(`El archivo ${file.name} no es una imagen valida.`, 400);
    }

    const uniqueName = `${Date.now()}-${file.name}`;
    const dropboxPath = buildDropboxPhotoPath(equipment.companyName, equipment.code, uniqueName);
    const bytes = await file.arrayBuffer();
    const metadata = await uploadDropboxFile(dropboxPath, bytes);

    await runQuery(async (query) => {
      query.input("companyId", sql.Int, equipment.companyId);
      query.input("equipmentId", sql.Int, equipmentId);
      query.input("originalName", sql.NVarChar(255), file.name);
      query.input("savedName", sql.NVarChar(255), metadata.name);
      query.input("dropboxPath", sql.NVarChar(500), metadata.path_display);
      query.input("dropboxId", sql.NVarChar(200), metadata.id);
      query.input("mimeType", sql.NVarChar(120), file.type || null);
      query.input("sizeBytes", sql.BigInt, file.size);

      return query.query(`
        INSERT INTO dbo.archivos_equipo (
          empresa_id, equipo_id, tipo_archivo, nombre_original, nombre_guardado, dropbox_path,
          dropbox_id, shared_link, mime_type, tamano_bytes, checksum
        )
        VALUES (
          @companyId, @equipmentId, 'Imagen', @originalName, @savedName, @dropboxPath,
          @dropboxId, NULL, @mimeType, @sizeBytes, NULL
        );
      `);
    });

    uploaded.push({ name: file.name, path: metadata.path_display, id: metadata.id });
  }

  return NextResponse.json({ ok: true, uploaded });
}
