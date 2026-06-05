import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth";

export async function getApiSession() {
  const session = await getSessionFromCookies();
  if (!session) {
    return null;
  }
  return session;
}

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function parseNumericId(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

