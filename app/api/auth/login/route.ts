import { NextResponse } from "next/server";
import {
  authenticateWithPassword,
  createSessionToken,
  getAuthCookieOptions,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";

export const runtime = "nodejs";

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Error desconocido";
}

export async function POST(request: Request) {
  try {
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
  } catch (error) {
    const message = toErrorMessage(error);
    console.error("login failed", error);

    if (message.includes("Faltan variables de entorno de SQL")) {
      return NextResponse.json(
        {
          error:
            "La autenticación no está configurada en el entorno desplegado. Faltan variables de SQL Server.",
        },
        { status: 503 },
      );
    }

    if (message.includes("AUTH_SECRET no está configurado")) {
      return NextResponse.json(
        {
          error: "La autenticación no está configurada en el entorno desplegado. Falta AUTH_SECRET.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        error: "No fue posible iniciar sesión por un error del servidor.",
      },
      { status: 500 },
    );
  }
}
