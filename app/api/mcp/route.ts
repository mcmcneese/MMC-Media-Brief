import { NextRequest, NextResponse } from "next/server";
import { isAirtableConfigured } from "@/lib/airtable";
import { CORS, bearer, originOf } from "@/lib/connector-auth";
import { TOOLS, ToolError } from "@/lib/connector-tools";

// The Talaria connector. Speaks the Model Context Protocol over plain
// request and response (no long-lived stream). Every call needs a signed-in
// access token; without one the reply tells Claude where to sign in.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"];
const SERVER = { name: "mercurius-media-brief", title: "Mercurius Media Brief", version: "1.0.0" };

type Rpc = { jsonrpc?: string; id?: string | number | null; method?: string; params?: Record<string, unknown> };

function challenge(req: NextRequest) {
  const meta = `${originOf(req)}/.well-known/oauth-protected-resource`;
  return NextResponse.json(
    { jsonrpc: "2.0", id: null, error: { code: -32001, message: "Sign-in required." } },
    { status: 401, headers: { ...CORS, "WWW-Authenticate": `Bearer resource_metadata="${meta}"` } }
  );
}

function ok(id: Rpc["id"], result: unknown) {
  return { jsonrpc: "2.0", id: id ?? null, result };
}
function err(id: Rpc["id"], code: number, message: string) {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message } };
}

async function handle(msg: Rpc): Promise<unknown | null> {
  const isNotification = msg.id === undefined || msg.id === null;
  switch (msg.method) {
    case "initialize": {
      const asked = typeof msg.params?.protocolVersion === "string" ? msg.params.protocolVersion : "";
      return ok(msg.id, {
        protocolVersion: VERSIONS.includes(asked) ? asked : VERSIONS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER,
        instructions: "Create media briefs, pre-fill them, and read their progress. Briefs are sent to companies by a person, never by this connector.",
      });
    }
    case "ping":
      return ok(msg.id, {});
    case "tools/list":
      return ok(msg.id, {
        tools: TOOLS.map((t) => ({ name: t.name, title: t.title, description: t.description, inputSchema: t.inputSchema, annotations: t.annotations })),
      });
    case "tools/call": {
      const tool = TOOLS.find((t) => t.name === msg.params?.name);
      if (!tool) return err(msg.id, -32602, "Unknown tool.");
      if (!isAirtableConfigured()) {
        return ok(msg.id, { content: [{ type: "text", text: "Brief records are not available on this deployment." }], isError: true });
      }
      try {
        const args = (msg.params?.arguments && typeof msg.params.arguments === "object" ? msg.params.arguments : {}) as Record<string, unknown>;
        const result = await tool.run(args);
        return ok(msg.id, { content: [{ type: "text", text: JSON.stringify(result) }], structuredContent: result, isError: false });
      } catch (e) {
        if (!(e instanceof ToolError)) console.error(`[mcp] ${tool.name} failed:`, e);
        const text = e instanceof ToolError ? e.message : "The brief records could not be reached. Please try again.";
        return ok(msg.id, { content: [{ type: "text", text }], isError: true });
      }
    }
    default:
      if (isNotification) return null;
      return err(msg.id, -32601, "Method not found.");
  }
}

export async function POST(req: NextRequest) {
  if (!bearer(req)) return challenge(req);
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(err(null, -32700, "Parse error."), { status: 400, headers: CORS });
  }
  if (Array.isArray(body)) {
    const replies = (await Promise.all(body.slice(0, 20).map((m) => handle(m as Rpc)))).filter((r) => r !== null);
    if (replies.length === 0) return new NextResponse(null, { status: 202, headers: CORS });
    return NextResponse.json(replies, { headers: CORS });
  }
  const reply = await handle((body ?? {}) as Rpc);
  if (reply === null) return new NextResponse(null, { status: 202, headers: CORS });
  return NextResponse.json(reply, { headers: CORS });
}

// No server-initiated stream is offered.
export async function GET(req: NextRequest) {
  if (!bearer(req)) return challenge(req);
  return new NextResponse(null, { status: 405, headers: { ...CORS, Allow: "POST" } });
}

export async function DELETE() {
  return new NextResponse(null, { status: 405, headers: { ...CORS, Allow: "POST" } });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}
