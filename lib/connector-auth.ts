// ============================================================
// Sign-in for the Talaria connector (the /api/mcp endpoint).
//
// Claude connects with OAuth: it registers itself, sends the person to
// /oauth/authorize to sign in, then exchanges a one-time code for an access
// token. Everything issued here is a signed, expiring value, so nothing has
// to be stored. The signing key is derived from ADMIN_PASSWORD, so changing
// that password signs every connection out.
// ============================================================

import crypto from "node:crypto";
import type { NextRequest } from "next/server";

const KEY_PURPOSE = "talaria-connector-v1";

export const CODE_TTL_SECONDS = 120;
export const ACCESS_TTL_SECONDS = 60 * 60;
export const REFRESH_TTL_SECONDS = 60 * 60 * 24 * 30;
export const CLIENT_TTL_SECONDS = 60 * 60 * 24 * 365;

/** Only Claude's own sign-in return addresses are accepted. */
const ALLOWED_REDIRECTS = [
  "https://claude.ai/api/mcp/auth_callback",
  "https://claude.com/api/mcp/auth_callback",
];

export type SignedKind = "client" | "code" | "access" | "refresh";

function key(): Buffer | null {
  const pwd = process.env.ADMIN_PASSWORD ?? "";
  if (!pwd) return null;
  return crypto.createHmac("sha256", pwd).update(KEY_PURPOSE).digest();
}

export function isConnectorConfigured(): boolean {
  return key() !== null;
}

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function issue(kind: SignedKind, payload: Record<string, unknown>, ttlSeconds: number): string {
  const k = key();
  if (!k) throw new Error("Connector sign-in is not configured.");
  const body = b64url(
    Buffer.from(JSON.stringify({ ...payload, k: kind, exp: Math.floor(Date.now() / 1000) + ttlSeconds }))
  );
  const sig = b64url(crypto.createHmac("sha256", k).update(body).digest());
  return `${body}.${sig}`;
}

export function read(kind: SignedKind, token: unknown): Record<string, unknown> | null {
  const k = key();
  if (!k || typeof token !== "string" || token.length > 4000) return null;
  const [body, sig, extra] = token.split(".");
  if (!body || !sig || extra !== undefined) return null;
  const expected = b64url(crypto.createHmac("sha256", k).update(body).digest());
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64").toString("utf8")) as Record<string, unknown>;
    if (payload.k !== kind) return null;
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function isAllowedRedirect(uri: unknown): uri is string {
  if (typeof uri !== "string") return false;
  if (ALLOWED_REDIRECTS.includes(uri)) return true;
  // Local testing only, never on a deployed build.
  return process.env.NODE_ENV !== "production" && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(uri);
}

export function pkceMatches(verifier: unknown, challenge: unknown): boolean {
  if (typeof verifier !== "string" || typeof challenge !== "string") return false;
  if (verifier.length < 43 || verifier.length > 128) return false;
  const digest = b64url(crypto.createHash("sha256").update(verifier).digest());
  const a = Buffer.from(digest);
  const b = Buffer.from(challenge);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** The address this deployment is being reached at. */
export function originOf(req: NextRequest): string {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost";
  const proto = req.headers.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto.split(",")[0].trim()}://${host.split(",")[0].trim()}`;
}

/** Returns who is signed in on this request, or null. */
export function bearer(req: NextRequest): { who: string } | null {
  const header = req.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const payload = read("access", match[1].trim());
  if (!payload) return null;
  return { who: typeof payload.who === "string" ? payload.who : "admin" };
}

export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, Mcp-Protocol-Version, Mcp-Session-Id",
} as const;
