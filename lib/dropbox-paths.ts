function normalizeSegment(value: string) {
  return value.trim().replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-").replace(/\s+/g, " ");
}

export function buildDropboxRoot() {
  return "/EquipApp";
}

export function buildDropboxCompanyRoot(companyName: string) {
  return `${buildDropboxRoot()}/${normalizeSegment(companyName)}`;
}

export function buildDropboxEquipmentRoot(companyName: string, equipmentCode: string) {
  return `${buildDropboxCompanyRoot(companyName)}/equipos/${normalizeSegment(equipmentCode)}`;
}

export function buildDropboxDocumentPath(companyName: string, equipmentCode: string, fileName: string) {
  return `${buildDropboxEquipmentRoot(companyName, equipmentCode)}/documentos/${normalizeSegment(fileName)}`;
}

export function buildDropboxPhotoPath(companyName: string, equipmentCode: string, fileName: string) {
  return `${buildDropboxEquipmentRoot(companyName, equipmentCode)}/fotos/${normalizeSegment(fileName)}`;
}
