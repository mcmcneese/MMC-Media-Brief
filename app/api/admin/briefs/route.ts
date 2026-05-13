import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  AirtableConfigError,
  createBrief,
  isAirtableConfigured,
  listBriefs,
  generateBriefToken,
} from "@/lib/airtable";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
}

function airtableNotConfigured() {
  return NextResponse.json(
    {
      success: false,
      message:
        "Airtable is not configured. Set AIRTABLE_PAT and AIRTABLE_BASE_ID in Vercel environment variables.",
    },
    { status: 503 }
  );
}

export async function GET() {
  if (!isAdminAuthenticated()) return unauthorized();
  if (!isAirtableConfigured()) return airtableNotConfigured();
  try {
    const records = await listBriefs();
    return NextResponse.json({ success: true, records });
  } catch (err) {
    console.error("[/api/admin/briefs] GET failed:", err);
    if (err instanceof AirtableConfigError) return airtableNotConfigured();
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : "Failed to list briefs." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated()) return unauthorized();
  if (!isAirtableConfigured()) return airtableNotConfigured();

  let body: {
    companyName?: string;
    prospectName?: string;
    prospectEmail?: string;
    adminNotes?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request body." }, { status: 400 });
  }

  const companyName = (body.companyName ?? "").trim();
  if (!companyName) {
    return NextResponse.json(
      { success: false, message: "Company name is required." },
      { status: 400 }
    );
  }

  try {
    const record = await createBrief({
      companyName,
      prospectName: (body.prospectName ?? "").trim(),
      prospectEmail: (body.prospectEmail ?? "").trim(),
      adminNotes: (body.adminNotes ?? "").trim(),
      // Pre-generate a token so the admin can copy a /form?token=... link the
      // moment the brief is created — flips to "Sent" once the link is sent.
      token: generateBriefToken(),
      status: "Draft",
    });
    return NextResponse.json({ success: true, record });
  } catch (err) {
    console.error("[/api/admin/briefs] POST failed:", err);
    if (err instanceof AirtableConfigError) return airtableNotConfigured();
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : "Failed to create brief." },
      { status: 500 }
    );
  }
}
