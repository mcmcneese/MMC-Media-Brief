import { NextRequest, NextResponse } from "next/server";
import { getBriefByToken, isAirtableConfigured, updateBrief, type UpdateBriefInput } from "@/lib/airtable";
import { cleanAnswers } from "@/lib/brief-fields";

// Tracks a company's progress on its own brief: the first open, the first
// change, and saved answers. Every call needs the brief's personal token.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 200_000;

function refuse(status: number, message: string) {
  return NextResponse.json({ success: false, message }, { status });
}

export async function POST(req: NextRequest) {
  const text = await req.text().catch(() => "");
  if (!text || text.length > MAX_BODY_BYTES) return refuse(400, "Invalid request body.");
  let body: Record<string, unknown>;
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object") return refuse(400, "Invalid request body.");
    body = parsed as Record<string, unknown>;
  } catch {
    return refuse(400, "Invalid request body.");
  }

  const token = typeof body.briefToken === "string" ? body.briefToken.trim() : "";
  const event = body.event;
  if (!token) return refuse(403, "A personal brief link is required.");
  if (event !== "opened" && event !== "save") return refuse(400, "Unknown event.");
  if (!isAirtableConfigured()) return refuse(503, "Brief records are not available right now.");

  let brief: Awaited<ReturnType<typeof getBriefByToken>> = null;
  try {
    brief = await getBriefByToken(token);
  } catch (err) {
    console.error("[progress] Airtable lookup failed:", err);
    return refuse(503, "Brief records are not available right now.");
  }
  if (!brief) return refuse(403, "This brief link is not valid.");
  if (brief.status === "Submitted" || brief.status === "Expired") return refuse(409, "This brief is closed.");

  // Opened and Started are only stamped once a brief has been sent, so a
  // preview of an unsent draft by the team does not count as the company.
  const sent = brief.status === "Sent";
  const now = new Date().toISOString();
  const update: UpdateBriefInput = {};
  if (sent && !brief.openedAt) update.openedAt = now;

  if (event === "save") {
    const step = typeof body.step === "number" && body.step >= 0 && body.step <= 5 ? Math.floor(body.step) : 0;
    update.draft = { data: cleanAnswers(body.data), step, savedAt: now };
    if (sent && !brief.startedAt) update.startedAt = now;
  }

  if (Object.keys(update).length === 0) return NextResponse.json({ success: true, savedAt: null });
  try {
    await updateBrief(brief.id, update);
  } catch (err) {
    console.error("[progress] Airtable update failed:", err);
    return refuse(502, "Progress could not be saved. Please try again.");
  }
  return NextResponse.json({ success: true, savedAt: event === "save" ? now : null });
}
