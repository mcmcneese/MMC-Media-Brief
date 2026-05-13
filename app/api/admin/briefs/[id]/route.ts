import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  AirtableConfigError,
  deleteBrief,
  getBriefById,
  isAirtableConfigured,
  updateBrief,
  type BriefStatus,
} from "@/lib/airtable";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_STATUSES: ReadonlyArray<BriefStatus> = ["Draft", "Sent", "Submitted", "Expired"];

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

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdminAuthenticated()) return unauthorized();
  if (!isAirtableConfigured()) return airtableNotConfigured();
  try {
    const record = await getBriefById(params.id);
    if (!record) {
      return NextResponse.json({ success: false, message: "Brief not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, record });
  } catch (err) {
    if (err instanceof AirtableConfigError) return airtableNotConfigured();
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : "Failed to load brief." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdminAuthenticated()) return unauthorized();
  if (!isAirtableConfigured()) return airtableNotConfigured();

  let body: {
    companyName?: string;
    prospectName?: string;
    prospectEmail?: string;
    adminNotes?: string;
    status?: BriefStatus;
    markSent?: boolean;
    granolaNoteId?: string;
    granolaNoteUrl?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request body." }, { status: 400 });
  }

  // Build the patch
  const patch: Parameters<typeof updateBrief>[1] = {};
  if (typeof body.companyName === "string") patch.companyName = body.companyName.trim();
  if (typeof body.prospectName === "string") patch.prospectName = body.prospectName.trim();
  if (typeof body.prospectEmail === "string") patch.prospectEmail = body.prospectEmail.trim();
  if (typeof body.adminNotes === "string") patch.adminNotes = body.adminNotes.trim();
  if (typeof body.status === "string" && VALID_STATUSES.includes(body.status)) {
    patch.status = body.status;
  }
  if (body.markSent) {
    patch.status = "Sent";
    patch.sentAt = new Date().toISOString();
  }
  if (typeof body.granolaNoteId === "string") patch.granolaNoteId = body.granolaNoteId.trim();
  if (typeof body.granolaNoteUrl === "string") patch.granolaNoteUrl = body.granolaNoteUrl.trim();

  try {
    const record = await updateBrief(params.id, patch);
    return NextResponse.json({ success: true, record });
  } catch (err) {
    if (err instanceof AirtableConfigError) return airtableNotConfigured();
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : "Failed to update brief." },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdminAuthenticated()) return unauthorized();
  if (!isAirtableConfigured()) return airtableNotConfigured();
  try {
    await deleteBrief(params.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AirtableConfigError) return airtableNotConfigured();
    return NextResponse.json(
      { success: false, message: err instanceof Error ? err.message : "Failed to delete brief." },
      { status: 500 }
    );
  }
}
