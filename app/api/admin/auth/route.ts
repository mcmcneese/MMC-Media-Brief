import { NextRequest, NextResponse } from "next/server";
import {
  adminCookieAttributes,
  deriveAdminCookieValue,
  isAdminConfigured,
  passwordMatches,
} from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Admin is not configured on the server. Set ADMIN_PASSWORD in your Vercel environment.",
      },
      { status: 503 }
    );
  }

  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request body." }, { status: 400 });
  }

  const submitted = typeof body.password === "string" ? body.password : "";
  if (!passwordMatches(submitted)) {
    return NextResponse.json(
      { success: false, message: "Incorrect password." },
      { status: 401 }
    );
  }

  const value = deriveAdminCookieValue();
  const { name, options } = adminCookieAttributes(value);
  const res = NextResponse.json({ success: true });
  res.cookies.set(name, value, options);
  return res;
}

export async function DELETE() {
  const { name, options } = adminCookieAttributes("");
  const res = NextResponse.json({ success: true });
  res.cookies.set(name, "", { ...options, maxAge: 0 });
  return res;
}
