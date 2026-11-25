import { NextRequest, NextResponse } from "next/server";
import { CORS, originOf } from "@/lib/connector-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const origin = originOf(req);
  return NextResponse.json(
    {
      issuer: origin,
      authorization_endpoint: `${origin}/oauth/authorize`,
      token_endpoint: `${origin}/oauth/token`,
      registration_endpoint: `${origin}/oauth/register`,
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      code_challenge_methods_supported: ["S256"],
      token_endpoint_auth_methods_supported: ["none"],
      scopes_supported: ["briefs"],
    },
    { headers: CORS }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}
