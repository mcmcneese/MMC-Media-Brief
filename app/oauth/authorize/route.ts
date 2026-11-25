import { NextRequest, NextResponse } from "next/server";
import { passwordMatches } from "@/lib/admin-auth";
import { CODE_TTL_SECONDS, isAllowedRedirect, isConnectorConfigured, issue, read } from "@/lib/connector-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FIELDS = ["response_type", "client_id", "redirect_uri", "state", "code_challenge", "code_challenge_method", "scope", "resource"] as const;

function esc(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function page(body: string, status = 200) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>Sign in · Media Brief</title>
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#F4F5F7;color:#111317;font:15px/1.5 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
main{width:100%;max-width:380px;margin:24px;background:#fff;border-radius:16px;padding:28px;box-sizing:border-box}
h1{font-size:20px;line-height:26px;margin:0 0 6px}p{margin:0 0 18px;color:#5B616E;font-size:14px}
label{display:block;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#5B616E;margin-bottom:6px}
input{width:100%;height:44px;box-sizing:border-box;border:1px solid #D9DCE1;border-radius:10px;padding:0 12px;font:inherit}
button{width:100%;height:44px;margin-top:14px;border:0;border-radius:10px;background:#111317;color:#fff;font:inherit;font-weight:600;cursor:pointer}
.err{color:#B3261E;font-size:13px;margin:10px 0 0}</style></head><body><main>${body}</main></body></html>`;
  return new NextResponse(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Frame-Options": "DENY", "Referrer-Policy": "no-referrer" },
  });
}

/** Checks the request Claude sent. Returns the values, or a message for the person. */
function check(params: URLSearchParams): { ok: true; values: Record<string, string> } | { ok: false; message: string } {
  const values: Record<string, string> = {};
  for (const f of FIELDS) values[f] = params.get(f) ?? "";
  const client = read("client", values.client_id);
  if (!client) return { ok: false, message: "This sign-in request did not come from a registered Claude connector." };
  if (!isAllowedRedirect(values.redirect_uri) || !Array.isArray(client.uris) || !client.uris.includes(values.redirect_uri)) {
    return { ok: false, message: "This sign-in request has a return address that is not Claude's." };
  }
  if (values.response_type !== "code" || values.code_challenge_method !== "S256" || values.code_challenge.length < 43) {
    return { ok: false, message: "This sign-in request is incomplete. Remove the connector in Claude and add it again." };
  }
  return { ok: true, values };
}

function form(values: Record<string, string>, error = "") {
  const hidden = FIELDS.map((f) => `<input type="hidden" name="${f}" value="${esc(values[f])}">`).join("");
  return page(
    `<h1>Connect Talaria to Media Brief</h1><p>Sign in to let Talaria create briefs and read their progress.</p>
<form method="post" action="/oauth/authorize">${hidden}<label for="pw">Admin password</label>
<input id="pw" name="password" type="password" autocomplete="current-password" autofocus required>
${error ? `<div class="err">${esc(error)}</div>` : ""}<button type="submit">Sign in and connect</button></form>`,
    error ? 401 : 200
  );
}

export async function GET(req: NextRequest) {
  if (!isConnectorConfigured()) return page("<h1>Not available</h1><p>Sign-in is not configured on this deployment.</p>", 503);
  const result = check(req.nextUrl.searchParams);
  if (!result.ok) return page(`<h1>Cannot sign in</h1><p>${esc(result.message)}</p>`, 400);
  return form(result.values);
}

export async function POST(req: NextRequest) {
  if (!isConnectorConfigured()) return page("<h1>Not available</h1><p>Sign-in is not configured on this deployment.</p>", 503);
  const params = new URLSearchParams(await req.text());
  const result = check(params);
  if (!result.ok) return page(`<h1>Cannot sign in</h1><p>${esc(result.message)}</p>`, 400);
  if (!passwordMatches(params.get("password") ?? "")) {
    await new Promise((r) => setTimeout(r, 800));
    return form(result.values, "That password is not correct.");
  }
  const v = result.values;
  const code = issue("code", { cid: v.client_id, uri: v.redirect_uri, cc: v.code_challenge, who: "admin" }, CODE_TTL_SECONDS);
  const target = new URL(v.redirect_uri);
  target.searchParams.set("code", code);
  if (v.state) target.searchParams.set("state", v.state);
  return NextResponse.redirect(target.toString(), 303);
}
