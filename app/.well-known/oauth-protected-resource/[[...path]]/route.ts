import { NextRequest, NextResponse } from "next/server";
import { CORS, originOf } from "@/lib/connector-auth";

export const dynamic = "force-dynamic";

// Tells Claude where to sign in before it can use the connector.
export async function GET(req: NextRequest) {
  const origin = originOf(req);
  return NextResponse.json(
    {
      resource: `${origin}/api/mcp`,
      authorization_servers: [origin],
      bearer_methods_supported: ["header"],
      resource_name: "Mercurius Media Brief",
    },
    { headers: CORS }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}
