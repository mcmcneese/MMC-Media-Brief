import type { FormData } from "./types";
import { CONFIG } from "./config";
import { fmtCurrency } from "./docx-generator";

// -------------------- MMC notification --------------------
export function buildMmcNotification(data: FormData, downloadUrl: string): {
  subject: string;
  text: string;
  html: string;
} {
  const subject = `${CONFIG.EMAIL.mmcNotificationSubject} — ${data.companyName}`;

  const lines = [
    `New MMC Media Brief submitted.`,
    ``,
    `Company:        ${data.companyName}`,
    `Contact:        ${data.contactName} <${data.contactEmail}>`,
    `Website:        ${data.companyWebsite}`,
    `Primary Goal:   ${data.primaryGoal || "—"}`,
    `Budget:         ${data.budget != null ? fmtCurrency(data.budget) : "—"}`,
    `Start Date:     ${data.startDate || "—"}`,
    `End Date:       ${data.endDate || "—"}`,
    ``,
    `The full brief is attached as a Word document.`,
    `Prospect download link: ${downloadUrl}`,
  ];
  const text = lines.join("\n");

  const html = `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #1A1A1A; line-height: 1.5;">
  <p>New MMC Media Brief submitted.</p>
  <table cellpadding="4" cellspacing="0" style="border-collapse: collapse;">
    <tr><td style="color:#6B6B6B;">Company</td><td><strong>${escapeHtml(data.companyName)}</strong></td></tr>
    <tr><td style="color:#6B6B6B;">Contact</td><td>${escapeHtml(data.contactName)} &lt;${escapeHtml(data.contactEmail)}&gt;</td></tr>
    <tr><td style="color:#6B6B6B;">Website</td><td>${escapeHtml(data.companyWebsite)}</td></tr>
    <tr><td style="color:#6B6B6B;">Primary Goal</td><td>${escapeHtml(data.primaryGoal || "—")}</td></tr>
    <tr><td style="color:#6B6B6B;">Budget</td><td>${escapeHtml(data.budget != null ? fmtCurrency(data.budget) : "—")}</td></tr>
    <tr><td style="color:#6B6B6B;">Start Date</td><td>${escapeHtml(data.startDate || "—")}</td></tr>
    <tr><td style="color:#6B6B6B;">End Date</td><td>${escapeHtml(data.endDate || "—")}</td></tr>
  </table>
  <p>The full brief is attached as a Word document.</p>
  <p>Prospect download link: <a href="${escapeHtml(downloadUrl)}">${escapeHtml(downloadUrl)}</a></p>
</div>`;

  return { subject, text, html };
}

// -------------------- Prospect confirmation --------------------
export function buildProspectConfirmation(downloadUrl: string): {
  subject: string;
  text: string;
  html: string;
} {
  const subject = CONFIG.EMAIL.prospectConfirmationSubject;

  const text = CONFIG.PROSPECT_CONFIRMATION_BODY.replace(/{{DOWNLOAD_LINK}}/g, downloadUrl);

  const html = `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #1A1A1A; line-height: 1.6;">
  <p>Thanks for submitting your media brief to <strong>Mercurius Media Capital</strong>.</p>
  <p>Our team is reviewing your information and will be in touch to schedule a time to walk through Media Strategy.</p>
  <p>You can download a copy of your completed brief here:</p>
  <p><a href="${escapeHtml(downloadUrl)}" style="display:inline-block;padding:10px 16px;background:#C9A961;color:#0B1220;text-decoration:none;border-radius:4px;font-weight:600;">Download Your Brief</a></p>
  <p style="color:#6B6B6B;">— Mercurius Media Capital</p>
</div>`;

  return { subject, text, html };
}

// -------------------- Error alert --------------------
export function buildErrorAlert(err: unknown, payload: unknown): {
  subject: string;
  text: string;
  html: string;
} {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error && err.stack ? err.stack : "(no stack)";
  const payloadStr = safeStringify(payload);

  const subject = `[MMC Brief] Submission failure`;
  const text = [
    `A submission to the MMC brief form failed.`,
    ``,
    `Error: ${message}`,
    ``,
    `Stack:`,
    stack,
    ``,
    `Payload:`,
    payloadStr,
  ].join("\n");

  const html = `<div style="font-family: monospace; font-size: 13px; color: #1A1A1A;">
  <p><strong>MMC Brief — submission failure</strong></p>
  <p><strong>Error:</strong> ${escapeHtml(message)}</p>
  <pre style="background:#F7F5F0;padding:12px;border:1px solid #E5E2DC;white-space:pre-wrap;">${escapeHtml(stack)}</pre>
  <p><strong>Payload:</strong></p>
  <pre style="background:#F7F5F0;padding:12px;border:1px solid #E5E2DC;white-space:pre-wrap;">${escapeHtml(payloadStr)}</pre>
</div>`;

  return { subject, text, html };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeStringify(v: unknown): string {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}
