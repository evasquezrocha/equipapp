import { NextResponse } from "next/server";
import { resetPasswordFromToken } from "@/lib/password-reset";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const confirmPassword = typeof body?.confirmPassword === "string" ? body.confirmPassword : "";

  if (!token || !password || !confirmPassword) {
    return NextResponse.json({ error: "Completa todos los campos." }, { status: 400 });
  }

  if (password !== confirmPassword) {
    return NextResponse.json({ error: "Las contrasenas no coinciden." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "La contrasena debe tener al menos 8 caracteres." }, { status: 400 });
  }

  const ok = await resetPasswordFromToken(token, password);
  if (!ok) {
    return NextResponse.json({ error: "El enlace no es valido o ya expiro." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
