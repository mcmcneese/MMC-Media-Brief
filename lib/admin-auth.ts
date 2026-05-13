// Admin authentication helpers.
//
// Design:
//   - Single shared admin password lives in env var ADMIN_PASSWORD.
//   - When the password matches, we set an HttpOnly cookie whose value is an
//     HMAC of a constant string keyed with ADMIN_PASSWORD. An attacker cannot
//     produce a valid cookie without knowing the password, and the cookie
//     never carries the password itself.
//   - All /admin/* routes and /api/admin/* routes verify the cookie via
//     verifyAdminCookie().

import crypto from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "mmc_admin";
const ADMIN_COOKIE_PURPOSE = "mmc-admin-v1";
const SEVEN_DAYS_SECONDS = 60 * 60 * 24 * 7;

function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD ?? "";
}

export function isAdminConfigured(): boolean {
  return getAdminPassword().length > 0;
}

/** Returns the HMAC value we set as the cookie when password is correct. */
export function deriveAdminCookieValue(): string {
  const pwd = getAdminPassword();
  return crypto.createHmac("sha256", pwd).update(ADMIN_COOKIE_PURPOSE).digest("hex");
}

/** Constant-time check of a presented cookie value against the expected one. */
export function verifyAdminCookieValue(value: string): boolean {
  if (!isAdminConfigured()) return false;
  const expected = deriveAdminCookieValue();
  if (value.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(value), Buffer.from(expected));
  } catch {
    return false;
  }
}

/** Server-side: returns true if the request has a valid admin cookie. */
export function isAdminAuthenticated(): boolean {
  const jar = cookies();
  const c = jar.get(ADMIN_COOKIE_NAME);
  if (!c?.value) return false;
  return verifyAdminCookieValue(c.value);
}

/** Returns the Set-Cookie attributes to use for the admin session. */
export function adminCookieAttributes(value: string): {
  name: string;
  value: string;
  options: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: "lax";
    path: string;
    maxAge: number;
  };
} {
  return {
    name: ADMIN_COOKIE_NAME,
    value,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SEVEN_DAYS_SECONDS,
    },
  };
}

/** Constant-time string comparison for password verification. */
export function passwordMatches(input: string): boolean {
  const expected = getAdminPassword();
  if (!expected) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
