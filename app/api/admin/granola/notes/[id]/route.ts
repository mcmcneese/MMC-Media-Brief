import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  GranolaApiError,
  GranolaConfigError,
  getNote,
  isGranolaConfigured,
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
        "Granola is not configured. Set GRANOLA_API_KEY in Vercel environment variables.",
    },
    { status: 503 }
  );
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdminAuthenticated()) return unauthorized();
  if (!isGranolaConfigured()) return granolaNotConfigured();

  const url = new URL(req.url);
  const includeTranscript = url.searchParams.get("include") === "transcript";

  try {
    const note = await getNote(params.id, { includeTranscript });
    return NextResponse.json({ success: true, note });
  } catch (err) {
    if (err instanceof GranolaConfigError) return granolaNotConfigured();
    if (err instanceof GranolaApiError) {
      return NextResponse.json(
        { success: false, message: err.message },
        { status: err.status >= 400 && err.status < 600 ? err.status : 500 }
      );
    }
    console.error("[/api/admin/granola/notes/[id]] failed:", err);
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : "Failed to fetch Granola note." },
      { status: 500 }
    );
  }
}
