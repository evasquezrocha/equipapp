import { buildDropboxCompanyRoot } from "@/lib/dropbox-paths";

type DropboxTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

function getDropboxCredentials() {
  const appKey = process.env.DROPBOX_APP_KEY;
  const appSecret = process.env.DROPBOX_APP_SECRET;
  const refreshToken = process.env.DROPBOX_REFRESH_TOKEN;

  if (!appKey || !appSecret || !refreshToken) {
    throw new Error("Faltan credenciales de Dropbox en el entorno.");
  }

  return { appKey, appSecret, refreshToken };
}

export async function getDropboxAccessToken() {
  const { appKey, appSecret, refreshToken } = getDropboxCredentials();
  const authorization = Buffer.from(`${appKey}:${appSecret}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const response = await fetch("https://api.dropboxapi.com/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${authorization}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`No fue posible obtener token de Dropbox (${response.status}).`);
  }

  return (await response.json()) as DropboxTokenResponse;
}

async function callDropboxApi<T>(endpoint: string, payload: unknown, ignoreStatuses: number[] = []) {
  const token = await getDropboxAccessToken();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    if (ignoreStatuses.includes(response.status)) {
      return null as T;
    }
    throw new Error(`Dropbox API respondió con ${response.status}.`);
  }

  return (await response.json()) as T;
}

export async function ensureDropboxFolder(path: string) {
  const segments = path.split("/").filter(Boolean);
  let currentPath = "";

  for (const segment of segments) {
    currentPath += `/${segment}`;
    await callDropboxApi(
      "https://api.dropboxapi.com/2/files/create_folder_v2",
      {
        path: currentPath,
        autorename: false,
      },
      [409],
    );
  }
}

export async function ensureCompanyDropboxStructure(companyName: string) {
  const root = buildDropboxCompanyRoot(companyName);
  await ensureDropboxFolder(`${root}/equipos`);
  await ensureDropboxFolder(`${root}/colaboradores`);
}

type DropboxUploadResponse = {
  id: string;
  name: string;
  path_display: string;
  path_lower: string;
};

export async function uploadDropboxFile(path: string, bytes: ArrayBuffer | Uint8Array | Buffer) {
  const token = await getDropboxAccessToken();
  const body = bytes instanceof ArrayBuffer ? bytes : bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const response = await fetch("https://content.dropboxapi.com/2/files/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      "Content-Type": "application/octet-stream",
      "Dropbox-API-Arg": JSON.stringify({
        path,
        mode: { ".tag": "add" },
        autorename: true,
        mute: false,
      }),
    },
    body: body as BodyInit,
  });

  if (!response.ok) {
    throw new Error(`Dropbox upload respondió con ${response.status}.`);
  }

  return (await response.json()) as DropboxUploadResponse;
}
