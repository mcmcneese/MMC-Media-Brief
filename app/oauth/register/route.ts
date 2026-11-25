import { NextRequest, NextResponse } from "next/server";
import { CLIENT_TTL_SECONDS, CORS, isAllowedRedirect, isConnectorConfigured, issue } from "@/lib/connector-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Claude registers itself here before sending anyone to sign in. Only
// Claude's own return addresses are accepted.
export async function POST(req: NextRequest) {
  if (!isConnectorConfigured()) {
    return NextResponse.json({ error: "server_error", error_description: "Sign-in is not configured." }, { status: 503, headers: CORS });
  }
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid_client_metadata" }, { status: 400, headers: CORS });
  }
  const uris = Array.isArray(body.redirect_uris) ? body.redirect_uris : [];
  if (uris.length === 0 || uris.length > 5 || !uris.every(isAllowedRedirect)) {
    return NextResponse.json(
      { error: "invalid_redirect_uri", error_description: "This connector only signs in through Claude." },
      { status: 400, headers: CORS }
    );
  }
  const name = typeof body.client_name === "string" ? body.client_name.slice(0, 80) : "Claude";
  const clientId = issue("client", { uris, name }, CLIENT_TTL_SECONDS);
  return NextResponse.json(
    {
      client_id: clientId,
      client_name: name,
      redirect_uris: uris,
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    },
    { status: 201, headers: CORS }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}
