import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { fullSchema } from "@/lib/schema";
import { generateBriefDocx } from "@/lib/docx-generator";
import { putDownload } from "@/lib/download-store";
import { CONFIG, getProductionUrl } from "@/lib/config";
import {
  buildErrorAlert,
  buildMmcNotification,
  buildProspectConfirmation,
} from "@/lib/email-templates";

// Node runtime — we use `fs` inside the docx generator to load the logo.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export async function POST(req: NextRequest) {
  let payload: unknown = null;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request body." },
      { status: 400 }
    );
  }

  // 1. Validate server-side (defense in depth)
  const parsed = fullSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        message: "Validation failed.",
        errors: parsed.error.issues,
      },
      { status: 400 }
    );
  }
  const data = parsed.data;

  try {
    // 2. Generate token + docx
    const token = crypto.randomUUID();
    const { buffer, filename } = await generateBriefDocx(data);

    // 3. Store in-memory (24h expiry handled internally)
    putDownload(token, buffer, filename);

    // 4. Build download URL
    const baseUrl = getProductionUrl();
    const downloadUrl = `${baseUrl.replace(/\/$/, "")}/api/download/${token}`;

    // 5. Send emails via Resend (if API key is present). If not configured, we still
    // complete the submission and return success — the download link will still work
    // and a warning is logged. This keeps local dev functional without keys.
    const resend = getResend();
    if (!resend) {
      console.warn(
        "[submit] RESEND_API_KEY is not set — skipping email delivery. " +
          "Set the env var to enable outbound email."
      );
    } else {
      const mmc = buildMmcNotification(data, downloadUrl);

      // While we send from Resend's `onboarding@resend.dev` test sender, Resend
      // only delivers to the account owner's email. Sending to prospect
      // addresses would silently fail. Skip the prospect confirmation entirely
      // until a custom domain is verified in Resend. The success page tells
      // the prospect to download their brief directly.
      const isUsingResendDev = CONFIG.EMAIL.from
        .toLowerCase()
        .includes("onboarding@resend.dev");

      const mmcPromise = resend.emails.send({
        from: CONFIG.EMAIL.from,
        to: [...CONFIG.EMAIL.mmcRecipients],
        subject: mmc.subject,
        text: mmc.text,
        html: mmc.html,
        attachments: [
          {
            filename,
            content: buffer,
          },
        ],
      });

      const prospectPromise: Promise<{ skipped: true } | unknown> = isUsingResendDev
        ? Promise.resolve({ skipped: true } as const)
        : resend.emails.send({
            from: CONFIG.EMAIL.from,
            to: [data.contactEmail],
            subject: CONFIG.EMAIL.prospectConfirmationSubject,
            text: buildProspectConfirmation(downloadUrl).text,
            html: buildProspectConfirmation(downloadUrl).html,
          });

      const [mmcRes, prospectRes] = await Promise.allSettled([mmcPromise, prospectPromise]);
      if (mmcRes.status === "rejected") {
        console.error("[submit] MMC notification email failed:", mmcRes.reason);
      }
      if (prospectRes.status === "rejected") {
        console.error("[submit] Prospect confirmation email failed:", prospectRes.reason);
      }
      if (isUsingResendDev) {
        console.info(
          "[submit] Skipped prospect confirmation email — Resend test sender (onboarding@resend.dev) only delivers to the account owner. Verify mmc.us in Resend to enable prospect confirmations."
        );
      }
      // The only failure mode that surfaces to the user is the MMC notification
      // failing. The prospect email is best-effort when active.
      if (mmcRes.status === "rejected") {
        throw new Error(
          `Email delivery failed: ${
            mmcRes.reason instanceof Error ? mmcRes.reason.message : String(mmcRes.reason)
          }`
        );
      }
    }

    return NextResponse.json({ success: true, token });
  } catch (err) {
    console.error("[submit] unhandled error:", err);
    // Best-effort error alert
    const resend = getResend();
    if (resend) {
      try {
        const alert = buildErrorAlert(err, payload);
        await resend.emails.send({
          from: CONFIG.EMAIL.from,
          to: [CONFIG.EMAIL.errorRecipient],
          subject: alert.subject,
          text: alert.text,
          html: alert.html,
        });
      } catch (e) {
        console.error("[submit] failed to send error alert:", e);
      }
    }
    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong submitting your brief. Our team has been notified — please try again in a moment.",
      },
      { status: 500 }
    );
  }
}
