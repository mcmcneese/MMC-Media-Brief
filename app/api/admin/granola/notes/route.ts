import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  GranolaApiError,
  GranolaConfigError,
  isGranolaConfigured,
  listNotes,
} from "@/lib/granola";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
}

function granolaNotConfigured() {
  return NextResponse.json(
    {
      success: false,
      message:
        "Granola is not configured. Set GRANOLA_API_KEY in Vercel environment variables (requires Granola Business or Enterprise plan).",
    },
    { status: 503 }
  );
}

export async function GET(req: NextRequest) {
  if (!isAdminAuthenticated()) return unauthorized();
  if (!isGranolaConfigured()) return granolaNotConfigured();

  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor") ?? undefined;
  const createdAfter = url.searchParams.get("created_after") ?? undefined;
  const limitRaw = url.searchParams.get("limit");
  const limit = limitRaw ? Math.min(Math.max(parseInt(limitRaw, 10) || 0, 1), 100) : 25;

  try {
    const data = await listNotes({ cursor, createdAfter, limit });
    return NextResponse.json({ success: true, ...data });
  } catch (err) {
    if (err instanceof GranolaConfigError) return granolaNotConfigured();
    if (err instanceof GranolaApiError) {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: err.status >= 400 && err.status < 600 ? err.status : 500 }
      );
    }
    console.error("[/api/admin/granola/notes] failed:", err);
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : "Failed to list Granola notes." },
      { status: 500 }
    );
  }
}
