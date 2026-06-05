import { NextResponse } from "next/server";
import { authenticateWithPassword, createSessionToken, getAuthCookieOptions, SESSION_COOKIE_NAME } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Debes ingresar correo y contraseña." }, { status: 400 });
  }

  const session = await authenticateWithPassword(email, password);
  if (!session) {
    return NextResponse.json({ error: "Credenciales inválidas o usuario sin acceso." }, { status: 401 });
  }

  const response = NextResponse.json({
    ok: true,
    user: {
      name: session.name,
      email: session.email,
      roleName: session.roleName,
      isAdmin: session.isAdmin,
    },
  });

  response.cookies.set(SESSION_COOKIE_NAME, createSessionToken(session), getAuthCookieOptions());
  return response;
}

