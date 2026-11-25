import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_TTL_SECONDS,
  CORS,
  REFRESH_TTL_SECONDS,
  issue,
  pkceMatches,
  read,
} from "@/lib/connector-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fail(error: string, description: string, status = 400) {
  return NextResponse.json({ error, error_description: description }, { status, headers: { ...CORS, "Cache-Control": "no-store" } });
}

function grant(who: string, clientId: string) {
  return NextResponse.json(
    {
      access_token: issue("access", { who, cid: clientId.slice(-16) }, ACCESS_TTL_SECONDS),
      token_type: "Bearer",
      expires_in: ACCESS_TTL_SECONDS,
      refresh_token: issue("refresh", { who, cid: clientId.slice(-16) }, REFRESH_TTL_SECONDS),
      scope: "briefs",
    },
    { headers: { ...CORS, "Cache-Control": "no-store" } }
  );
}

export async function POST(req: NextRequest) {
  let form: URLSearchParams;
  try {
    const type = req.headers.get("content-type") ?? "";
    form = type.includes("application/json")
      ? new URLSearchParams(Object.entries((await req.json()) as Record<string, string>))
      : new URLSearchParams(await req.text());
  } catch {
    return fail("invalid_request", "Unreadable request.");
  }
  const clientId = form.get("client_id") ?? "";
  const grantType = form.get("grant_type");

  if (grantType === "authorization_code") {
    const code = read("code", form.get("code"));
    if (!code) return fail("invalid_grant", "The sign-in code is not valid or has expired.");
    if (code.cid !== clientId || !read("client", clientId)) return fail("invalid_client", "Unknown client.", 401);
    if (code.uri !== form.get("redirect_uri")) return fail("invalid_grant", "The return address does not match.");
    if (!pkceMatches(form.get("code_verifier"), code.cc)) return fail("invalid_grant", "The sign-in check did not match.");
    return grant(String(code.who ?? "admin"), clientId);
  }

  if (grantType === "refresh_token") {
    const refresh = read("refresh", form.get("refresh_token"));
    if (!refresh) return fail("invalid_grant", "Please sign in again.");
    if (clientId && refresh.cid !== clientId.slice(-16)) return fail("invalid_grant", "Please sign in again.");
    return grant(String(refresh.who ?? "admin"), clientId || String(refresh.cid));
  }

  return fail("unsupported_grant_type", "Unsupported grant type.");
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}
