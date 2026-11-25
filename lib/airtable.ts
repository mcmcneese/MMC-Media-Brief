// Airtable REST client for the "Briefs" table.
//
// All admin actions read/write through here. Form Data is stored as a JSON
// string in the "Form Data" long-text column and parsed on read.
//
// IMPORTANT — the field NAMES below must exactly match the column names you
// created in Airtable. If you rename a column, update FIELDS to match.

import type { FormData } from "./types";
import { EMPTY_FORM_DATA } from "./types";

const API_BASE = "https://api.airtable.com/v0";
const TABLE_NAME = "Briefs";

// Field names as they exist in the Airtable base. DO NOT rename without
// changing them here AND in your Airtable UI.
const FIELDS = {
  companyName: "Company Name",
  token: "Token",
  status: "Status",
  prospectName: "Prospect Name",
  prospectEmail: "Prospect Email",
  formData: "Form Data",
  sentAt: "Sent At",
  submittedAt: "Submitted At",
  granolaNoteId: "Granola Note ID",
  granolaNoteUrl: "Granola Note URL",
  adminNotes: "Admin Notes",
  createdAt: "Created At",
  lastEditedAt: "Last Edited At",
  openedAt: "Opened At",
  startedAt: "Started At",
  draftData: "Draft Data",
  reminderDraftedAt: "Reminder Drafted At",
} as const;

export type BriefStatus = "Draft" | "Sent" | "Submitted" | "Expired";

export interface BriefRecord {
  /** Airtable record ID (recXXXX...) */
  id: string;
  token: string;
  status: BriefStatus;
  companyName: string;
  prospectName: string;
  prospectEmail: string;
  formData: FormData;
  sentAt: string | null;
  submittedAt: string | null;
  granolaNoteId: string;
  granolaNoteUrl: string;
  adminNotes: string;
  createdAt: string | null;
  lastEditedAt: string | null;
  /** First time the company opened their link in a browser. */
  openedAt: string | null;
  /** First time the company changed an answer. */
  startedAt: string | null;
  /** The company's saved progress before submitting. Null until they start. */
  draft: BriefDraft | null;
  reminderDraftedAt: string | null;
}

export interface BriefDraft {
  data: Partial<FormData>;
  step: number;
  savedAt: string;
}

export interface CreateBriefInput {
  token?: string;
  status?: BriefStatus;
  companyName: string;
  prospectName?: string;
  prospectEmail?: string;
  formData?: Partial<FormData>;
  granolaNoteId?: string;
  granolaNoteUrl?: string;
  adminNotes?: string;
}

export interface UpdateBriefInput {
  token?: string;
  status?: BriefStatus;
  companyName?: string;
  prospectName?: string;
  prospectEmail?: string;
  formData?: Partial<FormData>;
  sentAt?: string | null;
  submittedAt?: string | null;
  granolaNoteId?: string;
  granolaNoteUrl?: string;
  adminNotes?: string;
  openedAt?: string | null;
  startedAt?: string | null;
  draft?: BriefDraft | null;
  reminderDraftedAt?: string | null;
}

// ---------- config / env ----------

export class AirtableConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AirtableConfigError";
  }
}

export function isAirtableConfigured(): boolean {
  return Boolean(process.env.AIRTABLE_PAT && process.env.AIRTABLE_BASE_ID);
}

function getConfig(): { pat: string; baseId: string } {
  const pat = process.env.AIRTABLE_PAT;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!pat || !baseId) {
    throw new AirtableConfigError(
      "Airtable is not configured. Set AIRTABLE_PAT and AIRTABLE_BASE_ID in your environment."
    );
  }
  return { pat, baseId };
}

// ---------- low-level fetch helper ----------

type AirtableFields = Record<string, unknown>;

interface AirtableRecord {
  id: string;
  createdTime: string;
  fields: AirtableFields;
}

interface AirtableListResponse {
  records: AirtableRecord[];
  offset?: string;
}

async function airtableFetch(
  path: string,
  init: RequestInit = {}
): Promise<unknown> {
  const { pat, baseId } = getConfig();
  const url = `${API_BASE}/${baseId}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${pat}`,
      "Content-Type": "application/json",
    },
    // Avoid Next caching for admin data — must always be fresh.
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Airtable ${init.method ?? "GET"} ${path} failed: ${res.status} ${res.statusText} ${body}`);
  }
  return res.json();
}

// ---------- mapping helpers ----------

function parseFormData(raw: unknown): FormData {
  if (typeof raw !== "string" || raw.trim().length === 0) {
    return { ...EMPTY_FORM_DATA };
  }
  try {
    const parsed = JSON.parse(raw) as Partial<FormData>;
    return { ...EMPTY_FORM_DATA, ...parsed };
  } catch {
    return { ...EMPTY_FORM_DATA };
  }
}

/**
 * Draft Data holds JSON. If the Airtable field has rich text formatting on,
 * Airtable returns it with markdown escapes, so a failed parse is retried
 * with those escapes removed before the draft is given up on.
 */
function parseDraft(raw: unknown): BriefDraft | null {
  if (typeof raw !== "string" || raw.trim().length === 0) return null;
  const attempts = [raw.trim(), raw.trim().replace(/\\([_*~`\[\]<>#+\-.!|()])/g, "$1")];
  for (const text of attempts) {
    try {
      const parsed = JSON.parse(text) as Partial<BriefDraft>;
      if (!parsed || typeof parsed !== "object" || typeof parsed.data !== "object" || parsed.data === null) continue;
      return {
        data: parsed.data as Partial<FormData>,
        step: typeof parsed.step === "number" ? parsed.step : 0,
        savedAt: typeof parsed.savedAt === "string" ? parsed.savedAt : "",
      };
    } catch {
      /* try the next form */
    }
  }
  return null;
}

function normalizeStatus(raw: unknown): BriefStatus {
  if (raw === "Sent" || raw === "Submitted" || raw === "Expired") return raw;
  return "Draft";
}

function recordToBrief(rec: AirtableRecord): BriefRecord {
  const f = rec.fields;
  return {
    id: rec.id,
    token: String(f[FIELDS.token] ?? ""),
    status: normalizeStatus(f[FIELDS.status]),
    companyName: String(f[FIELDS.companyName] ?? ""),
    prospectName: String(f[FIELDS.prospectName] ?? ""),
    prospectEmail: String(f[FIELDS.prospectEmail] ?? ""),
    formData: parseFormData(f[FIELDS.formData]),
    sentAt: (f[FIELDS.sentAt] as string | undefined) ?? null,
    submittedAt: (f[FIELDS.submittedAt] as string | undefined) ?? null,
    granolaNoteId: String(f[FIELDS.granolaNoteId] ?? ""),
    granolaNoteUrl: String(f[FIELDS.granolaNoteUrl] ?? ""),
    adminNotes: String(f[FIELDS.adminNotes] ?? ""),
    createdAt: (f[FIELDS.createdAt] as string | undefined) ?? rec.createdTime,
    lastEditedAt: (f[FIELDS.lastEditedAt] as string | undefined) ?? null,
    openedAt: (f[FIELDS.openedAt] as string | undefined) ?? null,
    startedAt: (f[FIELDS.startedAt] as string | undefined) ?? null,
    draft: parseDraft(f[FIELDS.draftData]),
    reminderDraftedAt: (f[FIELDS.reminderDraftedAt] as string | undefined) ?? null,
  };
}

function fieldsFromInput(input: CreateBriefInput | UpdateBriefInput): AirtableFields {
  const f: AirtableFields = {};
  if ("companyName" in input && input.companyName !== undefined) {
    f[FIELDS.companyName] = input.companyName;
  }
  if ("token" in input && input.token !== undefined) {
    f[FIELDS.token] = input.token;
  }
  if ("status" in input && input.status !== undefined) {
    f[FIELDS.status] = input.status;
  }
  if ("prospectName" in input && input.prospectName !== undefined) {
    f[FIELDS.prospectName] = input.prospectName;
  }
  if ("prospectEmail" in input && input.prospectEmail !== undefined) {
    f[FIELDS.prospectEmail] = input.prospectEmail;
  }
  if ("formData" in input && input.formData !== undefined) {
    f[FIELDS.formData] = JSON.stringify({ ...EMPTY_FORM_DATA, ...input.formData });
  }
  if ("sentAt" in input) {
    f[FIELDS.sentAt] = input.sentAt;
  }
  if ("submittedAt" in input) {
    f[FIELDS.submittedAt] = input.submittedAt;
  }
  if ("granolaNoteId" in input && input.granolaNoteId !== undefined) {
    f[FIELDS.granolaNoteId] = input.granolaNoteId;
  }
  if ("granolaNoteUrl" in input && input.granolaNoteUrl !== undefined) {
    f[FIELDS.granolaNoteUrl] = input.granolaNoteUrl;
  }
  if ("adminNotes" in input && input.adminNotes !== undefined) {
    f[FIELDS.adminNotes] = input.adminNotes;
  }
  if ("openedAt" in input && input.openedAt !== undefined) {
    f[FIELDS.openedAt] = input.openedAt;
  }
  if ("startedAt" in input && input.startedAt !== undefined) {
    f[FIELDS.startedAt] = input.startedAt;
  }
  if ("draft" in input && input.draft !== undefined) {
    f[FIELDS.draftData] = input.draft === null ? "" : JSON.stringify(input.draft);
  }
  if ("reminderDraftedAt" in input && input.reminderDraftedAt !== undefined) {
    f[FIELDS.reminderDraftedAt] = input.reminderDraftedAt;
  }
  return f;
}

// ---------- public API ----------

const TABLE_PATH = `/${encodeURIComponent(TABLE_NAME)}`;

export async function listBriefs(options: { pageSize?: number } = {}): Promise<BriefRecord[]> {
  const pageSize = options.pageSize ?? 100;
  const params = new URLSearchParams({
    pageSize: String(pageSize),
    "sort[0][field]": FIELDS.createdAt,
    "sort[0][direction]": "desc",
  });
  const data = (await airtableFetch(`${TABLE_PATH}?${params.toString()}`)) as AirtableListResponse;
  return data.records.map(recordToBrief);
}

export async function getBriefById(id: string): Promise<BriefRecord | null> {
  try {
    const data = (await airtableFetch(`${TABLE_PATH}/${id}`)) as AirtableRecord;
    return recordToBrief(data);
  } catch (err) {
    if (err instanceof Error && err.message.includes("404")) return null;
    throw err;
  }
}

export async function getBriefByToken(token: string): Promise<BriefRecord | null> {
  // Tokens are URL-safe by construction; anything else cannot match a brief
  // and is never placed in the formula.
  if (!token || !/^[A-Za-z0-9_-]{8,64}$/.test(token)) return null;
  const safe = token;
  const formula = `({${FIELDS.token}} = "${safe}")`;
  const params = new URLSearchParams({
    filterByFormula: formula,
    maxRecords: "1",
  });
  const data = (await airtableFetch(`${TABLE_PATH}?${params.toString()}`)) as AirtableListResponse;
  return data.records[0] ? recordToBrief(data.records[0]) : null;
}

export async function createBrief(input: CreateBriefInput): Promise<BriefRecord> {
  const fields = fieldsFromInput(input);
  // Default new briefs to Draft status unless caller specified otherwise.
  if (!(FIELDS.status in fields)) fields[FIELDS.status] = "Draft";
  // Ensure formData is always set, even if empty.
  if (!(FIELDS.formData in fields)) fields[FIELDS.formData] = JSON.stringify(EMPTY_FORM_DATA);

  const data = (await airtableFetch(TABLE_PATH, {
    method: "POST",
    body: JSON.stringify({ records: [{ fields }] }),
  })) as { records: AirtableRecord[] };
  return recordToBrief(data.records[0]);
}

export async function updateBrief(id: string, input: UpdateBriefInput): Promise<BriefRecord> {
  const fields = fieldsFromInput(input);
  const data = (await airtableFetch(TABLE_PATH, {
    method: "PATCH",
    body: JSON.stringify({ records: [{ id, fields }] }),
  })) as { records: AirtableRecord[] };
  return recordToBrief(data.records[0]);
}

export async function deleteBrief(id: string): Promise<void> {
  await airtableFetch(`${TABLE_PATH}/${id}`, { method: "DELETE" });
}

/** Generates a URL-safe random token suitable for use in /form?token=... */
export function generateBriefToken(): string {
  // 22-char base64url (132 bits), URL-safe, no padding
  const bytes = require("crypto").randomBytes(16) as Buffer;
  return bytes
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
