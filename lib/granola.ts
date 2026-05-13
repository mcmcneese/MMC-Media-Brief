// Granola public API client.
// Spec: https://docs.granola.ai/api-reference/
//
// Auth: Bearer grn_... in Authorization header.
// Base: https://public-api.granola.ai/v1
// Rate limits: 5 req/sec sustained, 25 burst per 5s.

const API_BASE = "https://public-api.granola.ai/v1";

// ---- Public types ----

export interface GranolaUser {
  name: string | null;
  email: string;
}

export interface GranolaNoteSummary {
  id: string; // e.g. not_1d3tmYTlCICgjy
  object: "note";
  title: string | null;
  owner: GranolaUser;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

export interface GranolaCalendarEvent {
  event_title?: string;
  invitees?: Array<{ email: string }>;
  organiser?: string;
  calendar_event_id?: string;
  scheduled_start_time?: string;
  scheduled_end_time?: string;
}

export interface GranolaFolder {
  id: string;
  object: "folder";
  name: string;
  parent_folder_id?: string | null;
}

export interface GranolaTranscriptTurn {
  speaker: {
    source: string;
    diarization_label: string;
  };
  text: string;
  start_time: string;
  end_time: string;
}

export interface GranolaNote extends GranolaNoteSummary {
  web_url: string;
  calendar_event?: GranolaCalendarEvent | null;
  attendees?: GranolaUser[];
  folder_membership?: GranolaFolder[];
  summary_text?: string | null;
  summary_markdown?: string | null;
  transcript?: GranolaTranscriptTurn[] | null;
}

export interface GranolaListResponse {
  notes: GranolaNoteSummary[];
  hasMore: boolean;
  cursor: string | null;
}

export class GranolaConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GranolaConfigError";
  }
}

export class GranolaApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "GranolaApiError";
    this.status = status;
  }
}

// ---- Config ----

export function isGranolaConfigured(): boolean {
  return Boolean(process.env.GRANOLA_API_KEY);
}

function getApiKey(): string {
  const key = process.env.GRANOLA_API_KEY;
  if (!key) {
    throw new GranolaConfigError(
      "Granola is not configured. Set GRANOLA_API_KEY in your environment."
    );
  }
  return key;
}

// ---- Fetch helper ----

async function granolaFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const key = getApiKey();
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new GranolaApiError(
      `Granola ${init.method ?? "GET"} ${path} failed: ${res.status} ${res.statusText} ${body}`,
      res.status
    );
  }
  return (await res.json()) as T;
}

// ---- Public API ----

export interface ListNotesOptions {
  /** ISO 8601 datetime; only include notes created at or after this time. */
  createdAfter?: string;
  /** Cursor for pagination (taken from a previous response's `cursor`). */
  cursor?: string;
  /** Limit per page. Granola supports up to 100; defaults to 25 for the UI. */
  limit?: number;
}

export async function listNotes(options: ListNotesOptions = {}): Promise<GranolaListResponse> {
  const qs = new URLSearchParams();
  if (options.createdAfter) qs.set("created_after", options.createdAfter);
  if (options.cursor) qs.set("cursor", options.cursor);
  if (options.limit) qs.set("limit", String(options.limit));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return granolaFetch<GranolaListResponse>(`/notes${suffix}`);
}

export async function getNote(
  id: string,
  options: { includeTranscript?: boolean } = {}
): Promise<GranolaNote> {
  const qs = new URLSearchParams();
  if (options.includeTranscript) qs.set("include", "transcript");
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return granolaFetch<GranolaNote>(`/notes/${encodeURIComponent(id)}${suffix}`);
}

// ---- Helpers ----

/** Builds a single newline-separated plain-text transcript from the turns array. */
export function transcriptToPlainText(turns: GranolaTranscriptTurn[] | null | undefined): string {
  if (!turns || turns.length === 0) return "";
  return turns
    .map((t) => {
      const label = t.speaker?.diarization_label || "Speaker";
      return `${label}: ${t.text}`;
    })
    .join("\n");
}

/** Best-effort short preview of a note for list rows. */
export function notePreview(note: GranolaNote): string {
  if (note.summary_text && note.summary_text.trim()) {
    return note.summary_text.slice(0, 200);
  }
  if (note.transcript && note.transcript.length > 0) {
    return transcriptToPlainText(note.transcript).slice(0, 200);
  }
  return "";
}
