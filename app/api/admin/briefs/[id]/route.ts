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
import type { FormData } from "@/lib/types";

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

  // If the admin is changing any of the top-level contact/company columns,
  // mirror the new values into the brief's formData JSON so the prospect
  // sees them pre-filled when they next open /form?token=...
  // No round trip when only adminNotes / status / granolaNote* change.
  const isCompanyNameUpdate = typeof body.companyName === "string";
  const isProspectNameUpdate = typeof body.prospectName === "string";
  const isProspectEmailUpdate = typeof body.prospectEmail === "string";
  if (isCompanyNameUpdate || isProspectNameUpdate || isProspectEmailUpdate) {
    try {
      const current = await getBriefById(params.id);
      if (current) {
        const nextFormData: FormData = { ...current.formData };
        if (isCompanyNameUpdate) {
          nextFormData.companyName = patch.companyName ?? "";
        }
        if (isProspectNameUpdate) {
          nextFormData.contactName = patch.prospectName ?? "";
        }
        if (isProspectEmailUpdate) {
          nextFormData.contactEmail = patch.prospectEmail ?? "";
        }
        patch.formData = nextFormData;
      }
    } catch (err) {
      // Don't block the save on a mirror failure — log and continue.
      console.warn(
        "[/api/admin/briefs/[id]] failed to mirror top-level fields into formData:",
        err
      );
    }
  }

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
