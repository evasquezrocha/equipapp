import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

function toBase64Url(buffer: Buffer) {
  return buffer.toString("base64url");
}

export function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, KEY_LENGTH);
  return `scrypt$${toBase64Url(salt)}$${toBase64Url(derived)}`;
}

export function verifyPassword(password: string, storedHash: string) {
  if (!storedHash.startsWith("scrypt$")) {
    return false;
  }

  const [, saltPart, hashPart] = storedHash.split("$");
  if (!saltPart || !hashPart) {
    return false;
  }

  const salt = Buffer.from(saltPart, "base64url");
  const expected = Buffer.from(hashPart, "base64url");
  const actual = scryptSync(password, salt, expected.length);

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

