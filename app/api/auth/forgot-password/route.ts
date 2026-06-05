import { NextResponse } from "next/server";
import { createPasswordResetLink } from "@/lib/password-reset";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";

  if (!email) {
    return NextResponse.json({ error: "Debes ingresar un correo valido." }, { status: 400 });
  }

  const origin = request.headers.get("origin") ?? new URL(request.url).origin;
  const result = await createPasswordResetLink(email, origin);

  return NextResponse.json({
    ok: true,
    message: "Si el correo existe, se genero un enlace de recuperacion.",
    resetUrl: result?.resetUrl ?? null,
    expiresAt: result?.expiresAt?.toISOString() ?? null,
  });
}
