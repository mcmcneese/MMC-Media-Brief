// ============================================================
// What Talaria can do with briefs through the connector.
// Each tool reads or writes the Briefs table through lib/airtable.ts, the
// same way the admin pages do.
// ============================================================

import {
  createBrief,
  generateBriefToken,
  getBriefById,
  listBriefs,
  updateBrief,
  type BriefRecord,
  type UpdateBriefInput,
} from "./airtable";
import { getProductionUrl } from "./config";
import { EMPTY_FORM_DATA, type FormData } from "./types";

export type Stage = "Created" | "Sent" | "Opened" | "Started" | "Submitted" | "Expired";

export function stageOf(b: BriefRecord): Stage {
  if (b.status === "Expired") return "Expired";
  if (b.status === "Submitted") return "Submitted";
  if (b.status === "Sent") return b.startedAt ? "Started" : b.openedAt ? "Opened" : "Sent";
  return "Created";
}

function linkOf(b: BriefRecord): string {
  return b.token ? `${getProductionUrl().replace(/\/$/, "")}/form?token=${encodeURIComponent(b.token)}` : "";
}

function answered(data: Partial<FormData>): number {
  let n = 0;
  for (const key of Object.keys(EMPTY_FORM_DATA) as (keyof FormData)[]) {
    const v = data[key] as unknown;
    if (Array.isArray(v) ? v.length > 0 : typeof v === "string" ? v.trim().length > 0 : Boolean(v)) n++;
  }
  return n;
}

function summary(b: BriefRecord) {
  return {
    id: b.id,
    company: b.companyName,
    stage: stageOf(b),
    status: b.status,
    contactName: b.prospectName,
    contactEmail: b.prospectEmail,
    link: linkOf(b),
    createdAt: b.createdAt,
    sentAt: b.sentAt,
    openedAt: b.openedAt,
    startedAt: b.startedAt,
    submittedAt: b.submittedAt,
    reminderDraftedAt: b.reminderDraftedAt,
    lastEditedAt: b.lastEditedAt,
    granolaNoteUrl: b.granolaNoteUrl,
  };
}

function detail(b: BriefRecord) {
  const current = b.draft ? { ...b.formData, ...b.draft.data } : b.formData;
  return {
    ...summary(b),
    fieldsTotal: Object.keys(EMPTY_FORM_DATA).length,
    fieldsPrefilled: answered(b.formData),
    fieldsAnswered: answered(current),
    // What the team entered before sending (or the final answers once Submitted).
    answers: b.formData,
    // What the company has saved so far, before submitting. Null until they start.
    companyProgress: b.draft,
    adminNotes: b.adminNotes,
  };
}

/** Keep only known form fields, in the shape the form uses. */
function cleanPrefill(raw: unknown): Partial<FormData> {
  const out: Record<string, unknown> = {};
  if (!raw || typeof raw !== "object") return out as Partial<FormData>;
  const input = raw as Record<string, unknown>;
  for (const key of Object.keys(EMPTY_FORM_DATA) as (keyof FormData)[]) {
    if (!(key in input)) continue;
    const empty = EMPTY_FORM_DATA[key] as unknown;
    const value = input[key];
    if (Array.isArray(empty)) {
      if (Array.isArray(value)) out[key] = value.filter((v) => typeof v === "string").map((v) => (v as string).slice(0, 500));
    } else if (typeof empty === "string") {
      if (typeof value === "string") out[key] = value.slice(0, 20_000);
    } else if (typeof value === typeof empty) {
      out[key] = value;
    }
  }
  return out as Partial<FormData>;
}

function str(v: unknown, max = 300): string | undefined {
  return typeof v === "string" ? v.trim().slice(0, max) : undefined;
}

export class ToolError extends Error {}

async function need(id: unknown): Promise<BriefRecord> {
  if (typeof id !== "string" || !/^rec[A-Za-z0-9]{14}$/.test(id)) throw new ToolError("id must be a brief id from list_briefs.");
  const brief = await getBriefById(id);
  if (!brief) throw new ToolError("No brief has that id.");
  return brief;
}

const FIELD_NAMES = Object.keys(EMPTY_FORM_DATA);
const prefillSchema = {
  type: "object",
  description: `Answers to pre-fill, keyed by field name. Known fields: ${FIELD_NAMES.join(", ")}. Unknown fields are ignored.`,
  additionalProperties: true,
};

export interface ToolDef {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: { readOnlyHint: boolean; destructiveHint: boolean; idempotentHint: boolean; openWorldHint: boolean };
  run: (args: Record<string, unknown>) => Promise<unknown>;
}

const read = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
const write = { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false };

export const TOOLS: ToolDef[] = [
  {
    name: "list_briefs",
    title: "List briefs",
    description: "Every media brief with its company, stage (Created, Sent, Opened, Started, Submitted, Expired), dates and link. Answers are not included; use get_brief for those.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: read,
    run: async () => {
      const all = await listBriefs();
      return { count: all.length, briefs: all.map(summary) };
    },
  },
  {
    name: "get_brief",
    title: "Get a brief",
    description: "One brief in full: stage, dates, link, the answers, and the company's saved progress if they have started but not submitted.",
    inputSchema: { type: "object", properties: { id: { type: "string", description: "Brief id from list_briefs." } }, required: ["id"], additionalProperties: false },
    annotations: read,
    run: async (a) => detail(await need(a.id)),
  },
  {
    name: "create_brief",
    title: "Create a brief",
    description: "Create a new brief for a company. It starts at Created (not sent) and gets its own link. Optionally pre-fill answers.",
    inputSchema: {
      type: "object",
      properties: {
        companyName: { type: "string" },
        contactName: { type: "string" },
        contactEmail: { type: "string" },
        granolaNoteUrl: { type: "string" },
        adminNotes: { type: "string", description: "Internal notes. Never shown to the company." },
        prefill: prefillSchema,
      },
      required: ["companyName"],
      additionalProperties: false,
    },
    annotations: write,
    run: async (a) => {
      const companyName = str(a.companyName);
      if (!companyName) throw new ToolError("companyName is required.");
      const contactName = str(a.contactName) ?? "";
      const contactEmail = str(a.contactEmail) ?? "";
      const brief = await createBrief({
        token: generateBriefToken(),
        status: "Draft",
        companyName,
        prospectName: contactName,
        prospectEmail: contactEmail,
        granolaNoteUrl: str(a.granolaNoteUrl, 1000),
        adminNotes: str(a.adminNotes, 10_000),
        formData: { ...cleanPrefill(a.prefill), companyName, contactName, contactEmail },
      });
      return detail(brief);
    },
  },
  {
    name: "update_brief",
    title: "Update a brief's pre-fill",
    description: "Change the pre-filled answers, contact or internal notes on a brief that has not been submitted. Pre-fill values given here are merged over the existing ones.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        contactName: { type: "string" },
        contactEmail: { type: "string" },
        granolaNoteUrl: { type: "string" },
        adminNotes: { type: "string" },
        prefill: prefillSchema,
      },
      required: ["id"],
      additionalProperties: false,
    },
    annotations: write,
    run: async (a) => {
      const brief = await need(a.id);
      if (brief.status === "Submitted") throw new ToolError("This brief has been submitted and can no longer be changed.");
      const patch: UpdateBriefInput = {};
      const contactName = str(a.contactName);
      const contactEmail = str(a.contactEmail);
      if (contactName !== undefined) patch.prospectName = contactName;
      if (contactEmail !== undefined) patch.prospectEmail = contactEmail;
      if (str(a.granolaNoteUrl, 1000) !== undefined) patch.granolaNoteUrl = str(a.granolaNoteUrl, 1000);
      if (str(a.adminNotes, 10_000) !== undefined) patch.adminNotes = str(a.adminNotes, 10_000);
      if (a.prefill !== undefined || contactName !== undefined || contactEmail !== undefined) {
        patch.formData = {
          ...brief.formData,
          ...cleanPrefill(a.prefill),
          ...(contactName !== undefined ? { contactName } : {}),
          ...(contactEmail !== undefined ? { contactEmail } : {}),
        };
      }
      if (Object.keys(patch).length === 0) throw new ToolError("Nothing to change.");
      return detail(await updateBrief(brief.id, patch));
    },
  },
  {
    name: "mark_sent",
    title: "Mark a brief as sent",
    description: "Record that the brief's link has been sent to the company. Opened and Started are tracked from this point. Does not send anything itself.",
    inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"], additionalProperties: false },
    annotations: { ...write, idempotentHint: true },
    run: async (a) => {
      const brief = await need(a.id);
      if (brief.status === "Submitted") throw new ToolError("This brief has already been submitted.");
      if (brief.status === "Sent") return detail(brief);
      return detail(await updateBrief(brief.id, { status: "Sent", sentAt: new Date().toISOString() }));
    },
  },
  {
    name: "mark_reminder_drafted",
    title: "Record that a reminder was drafted",
    description: "Record that a reminder for an unopened brief has been drafted, so a second one is not drafted.",
    inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"], additionalProperties: false },
    annotations: { ...write, idempotentHint: true },
    run: async (a) => {
      const brief = await need(a.id);
      if (brief.reminderDraftedAt) return detail(brief);
      return detail(await updateBrief(brief.id, { reminderDraftedAt: new Date().toISOString() }));
    },
  },
];
