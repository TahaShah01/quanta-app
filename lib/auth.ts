// Session helpers for the admin panel and the client portal.
//
// BACKEND NOTE: this is a deliberately small, file-backed implementation so the
// admin and portal work out of the box. A backend developer can replace the
// three functions that touch storage (`lib/portal.ts`) and the credential check
// in `app/api/admin/login/route.ts` without touching any UI.
//
// Environment:
//   SESSION_SECRET   random string used to sign cookies (required in production)
//   ADMIN_PASSWORD   password for /admin (required in production)

import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

export const ADMIN_COOKIE = "quanta-admin";
export const PORTAL_COOKIE = "quanta-portal";

const DEV_SECRET = "quanta-dev-secret-change-me";

export function sessionSecret(): string | null {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 16) return secret;
  return process.env.NODE_ENV === "production" ? null : DEV_SECRET;
}

const b64 = (input: Buffer | string) => Buffer.from(input).toString("base64url");

function signature(body: string, secret: string) {
  return createHmac("sha256", secret).update(body).digest("base64url");
}

export interface SessionPayload {
  /** "admin" or a portal account id */
  sub: string;
  role: "admin" | "client";
  /** Expiry, seconds since epoch */
  exp: number;
}

export function createSession(
  sub: string,
  role: SessionPayload["role"],
  ttlSeconds: number
): string | null {
  const secret = sessionSecret();
  if (!secret) return null;
  const payload: SessionPayload = {
    sub,
    role,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const body = b64(JSON.stringify(payload));
  return `${body}.${signature(body, secret)}`;
}

export function readSession(token: string | undefined | null): SessionPayload | null {
  const secret = sessionSecret();
  if (!secret || !token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = signature(body, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionPayload;
    return payload.exp > Date.now() / 1000 ? payload : null;
  } catch {
    return null;
  }
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64url");
  const actual = scryptSync(password, Buffer.from(salt, "base64url"), expected.length);
  return timingSafeEqual(actual, expected);
}

/** Spend the same time a real password check would (for unknown accounts). */
export function burnHashTime(password: string) {
  scryptSync(password, "quanta-dummy-salt", 64);
}

/** Constant-time string comparison. */
export function safeEqual(a: string, b: string): boolean {
  const x = createHmac("sha256", "cmp").update(a).digest();
  const y = createHmac("sha256", "cmp").update(b).digest();
  return timingSafeEqual(x, y);
}

/** "open": no password needed (local dev only). "locked": production without a password set. */
export function adminMode(): "password" | "open" | "locked" {
  if (process.env.ADMIN_PASSWORD) return sessionSecret() ? "password" : "locked";
  return process.env.NODE_ENV === "production" ? "locked" : "open";
}

export function generatePassword(length = 12): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(length);
  return Array.from(bytes, (n) => alphabet[n % alphabet.length]).join("");
}

// Tiny in-memory throttle for login attempts (per key, per window).
const attempts = new Map<string, { count: number; reset: number }>();

export function tooManyAttempts(key: string, limit = 8, windowMs = 10 * 60_000): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.reset < now) {
    attempts.set(key, { count: 1, reset: now + windowMs });
    return false;
  }
  entry.count += 1;
  return entry.count > limit;
}

export function clearAttempts(key: string) {
  attempts.delete(key);
}
