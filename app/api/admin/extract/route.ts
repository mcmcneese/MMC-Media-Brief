import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  AirtableConfigError,
  getBriefById,
  isAirtableConfigured,
  updateBrief,
} from "@/lib/airtable";
import {
  ClaudeConfigError,
  extractFormData,
  isClaudeConfigured,
  mergeExtraction,
} from "@/lib/claude";
import {
  GranolaApiError,
  GranolaConfigError,
  getNote,
  isGranolaConfigured,
  transcriptToPlainText,
} from "@/lib/granola";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_DURATION_SECONDS = 60; // Vercel hint — Claude calls can take a moment.
export const maxDuration = MAX_DURATION_SECONDS;

function unauthorized() {
  return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
}

function notConfigured(message: string) {
  return NextResponse.json({ success: false, message }, { status: 503 });
}

interface ExtractRequestBody {
  briefId?: string;
  /**
   * Optional raw text to extract from. If omitted, the endpoint fetches the
   * transcript of the brief's linked Granola note.
   */
  text?: string;
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated()) return unauthorized();
  if (!isAirtableConfigured()) {
    return notConfigured(
      "Airtable is not configured. Set AIRTABLE_PAT and AIRTABLE_BASE_ID in Vercel."
    );
  }
  if (!isClaudeConfigured()) {
    return notConfigured(
      "Claude is not configured. Set ANTHROPIC_API_KEY in Vercel environment variables."
    );
  }

  let body: ExtractRequestBody;
  try {
    body = (await req.json()) as ExtractRequestBody;
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request body." },
      { status: 400 }
    );
  }

  const briefId = (body.briefId ?? "").trim();
  if (!briefId) {
    return NextResponse.json(
      { success: false, message: "briefId is required." },
      { status: 400 }
    );
  }

  try {
    const brief = await getBriefById(briefId);
    if (!brief) {
      return NextResponse.json(
        { success: false, message: "Brief not found." },
        { status: 404 }
      );
    }

    // Resolve the source text. Explicit `text` wins; otherwise pull from Granola.
    let sourceText = typeof body.text === "string" ? body.text.trim() : "";
    let usedGranola = false;
    if (!sourceText) {
      if (!brief.granolaNoteId) {
        return NextResponse.json(
          {
            success: false,
            message:
              "This brief has no Granola note linked and no text was provided. Link a Granola note first, or paste notes manually.",
          },
          { status: 400 }
        );
      }
      if (!isGranolaConfigured()) {
        return notConfigured(
          "Granola is not configured. Set GRANOLA_API_KEY in Vercel, or paste notes manually."
        );
      }
      const note = await getNote(brief.granolaNoteId, { includeTranscript: true });
      const transcript = transcriptToPlainText(note.transcript);
      const summary = (note.summary_text ?? "").trim();
      // Hand Claude both summary and transcript when both exist — the summary
      // is high-signal context, the transcript is the source of truth.
      sourceText = [
        summary ? `## Note summary\n${summary}` : "",
        transcript ? `## Transcript\n${transcript}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");
      usedGranola = true;
    }

    if (!sourceText) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No content to extract from — the linked Granola note has no summary or transcript yet. Try again after Granola finishes processing it.",
        },
        { status: 400 }
      );
    }

    // Run Claude.
    const { extracted, usage } = await extractFormData(sourceText);
    const extractedKeys = Object.keys(extracted);

    // Merge into the brief's existing formData (keeps admin-entered overrides).
    const mergedFormData = mergeExtraction(brief.formData, extracted);

    // Persist. Also propagate extracted contact + company onto the top-level
    // brief columns if Claude found them and they're currently empty — this
    // makes the dashboard row more useful without overwriting admin edits.
    const patchInput: Parameters<typeof updateBrief>[1] = {
      formData: mergedFormData,
    };
    if (!brief.companyName.trim() && typeof extracted.companyName === "string") {
      patchInput.companyName = extracted.companyName;
    }
    if (!brief.prospectName.trim() && typeof extracted.contactName === "string") {
      patchInput.prospectName = extracted.contactName;
    }
    if (
      !brief.prospectEmail.trim() &&
      typeof extracted.contactEmail === "string"
    ) {
      patchInput.prospectEmail = extracted.contactEmail;
    }

    const updated = await updateBrief(brief.id, patchInput);

    return NextResponse.json({
      success: true,
      record: updated,
      extracted,
      extractedFieldCount: extractedKeys.length,
      extractedFields: extractedKeys,
      usedGranola,
      usage,
    });
  } catch (err) {
    if (err instanceof AirtableConfigError) {
      return notConfigured(err.message);
    }
    if (err instanceof ClaudeConfigError) {
      return notConfigured(err.message);
    }
    if (err instanceof GranolaConfigError) {
      return notConfigured(err.message);
    }
    // Forward upstream Anthropic / Granola HTTP errors with their real status
    // + message so the UI shows the actual failure instead of "Extraction failed."
    if (err instanceof Anthropic.APIError) {
      console.error(
        `[/api/admin/extract] Anthropic API error (${err.status}):`,
        err.message,
        // err has additional fields (request_id, headers) — log all of them
        JSON.stringify({ name: err.name, status: err.status }, null, 2)
      );
      return NextResponse.json(
        {
          success: false,
          message: `Claude API error (${err.status}): ${err.message}`,
        },
        { status: err.status >= 400 && err.status < 600 ? err.status : 500 }
      );
    }
    if (err instanceof GranolaApiError) {
      console.error(
        `[/api/admin/extract] Granola API error (${err.status}):`,
        err.message
      );
      return NextResponse.json(
        { success: false, message: `Granola API error: ${err.message}` },
        { status: err.status >= 400 && err.status < 600 ? err.status : 500 }
      );
    }
    console.error("[/api/admin/extract] failed:", err);
    if (err instanceof Error) {
      console.error("[/api/admin/extract] stack:", err.stack);
    }
    return NextResponse.json(
      {
        success: false,
        message: err instanceof Error ? err.message : "Extraction failed.",
      },
      { status: 500 }
    );
  }
}
