"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Link2Off, RefreshCw, FileText, Sparkles, Check } from "lucide-react";
import type { GranolaNote, GranolaNoteSummary } from "@/lib/granola";

interface GranolaNoteCardProps {
  briefId: string;
  initialNoteId: string;
  initialNoteUrl: string;
  onUpdate?: (next: { granolaNoteId: string; granolaNoteUrl: string }) => void;
}

/**
 * UI for the brief detail page:
 *  - If no Granola note is linked: shows a "Link a Granola note" button that
 *    opens an inline picker of recent notes.
 *  - If a note is linked: shows its title, web URL, attendees, and a button to
 *    fetch + display the transcript. "Unlink" clears the linkage.
 *
 * Persistence happens by PATCHing /api/admin/briefs/{briefId}.
 */
export default function GranolaNoteCard({
  briefId,
  initialNoteId,
  initialNoteUrl,
  onUpdate,
}: GranolaNoteCardProps) {
  const router = useRouter();

  const [noteId, setNoteId] = useState(initialNoteId);
  const [noteUrl, setNoteUrl] = useState(initialNoteUrl);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerNotes, setPickerNotes] = useState<GranolaNoteSummary[]>([]);
  const [pickerCursor, setPickerCursor] = useState<string | null>(null);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerErr, setPickerErr] = useState("");

  const [linkedNote, setLinkedNote] = useState<GranolaNote | null>(null);
  const [linkedLoading, setLinkedLoading] = useState(false);
  const [linkedErr, setLinkedErr] = useState("");

  const [transcript, setTranscript] = useState<GranolaNote["transcript"]>(null);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [transcriptErr, setTranscriptErr] = useState("");

  const [prefilling, setPrefilling] = useState(false);
  const [prefillErr, setPrefillErr] = useState("");
  const [prefillResult, setPrefillResult] = useState<{
    fields: string[];
  } | null>(null);

  // When we have a linked noteId, fetch its metadata (without transcript).
  useEffect(() => {
    if (!noteId) {
      setLinkedNote(null);
      return;
    }
    let cancelled = false;
    setLinkedLoading(true);
    setLinkedErr("");
    fetch(`/api/admin/granola/notes/${encodeURIComponent(noteId)}`)
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.message ?? "Failed to fetch note.");
        return body.note as GranolaNote;
      })
      .then((note) => {
        if (cancelled) return;
        setLinkedNote(note);
        // Backfill noteUrl from API if Airtable's column was empty
        if (!noteUrl && note.web_url) setNoteUrl(note.web_url);
      })
      .catch((e) => {
        if (cancelled) return;
        setLinkedErr(e instanceof Error ? e.message : "Failed to fetch note.");
      })
      .finally(() => {
        if (!cancelled) setLinkedLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [noteId, noteUrl]);

  async function patchLink(nextId: string, nextUrl: string) {
    const res = await fetch(`/api/admin/briefs/${briefId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        granolaNoteId: nextId,
        granolaNoteUrl: nextUrl,
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body?.message ?? "Failed to update brief.");
    setNoteId(nextId);
    setNoteUrl(nextUrl);
    if (!nextId) {
      setLinkedNote(null);
      setTranscript(null);
    }
    onUpdate?.({ granolaNoteId: nextId, granolaNoteUrl: nextUrl });
  }

  async function loadPickerPage(cursor?: string) {
    setPickerLoading(true);
    setPickerErr("");
    try {
      const url = new URL("/api/admin/granola/notes", window.location.origin);
      url.searchParams.set("limit", "25");
      if (cursor) url.searchParams.set("cursor", cursor);
      const res = await fetch(url.toString());
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message ?? "Failed to list notes.");
      const notes = (body.notes ?? []) as GranolaNoteSummary[];
      const nextCursor: string | null = body.cursor ?? null;
      setPickerNotes((prev) => (cursor ? [...prev, ...notes] : notes));
      setPickerCursor(body.hasMore ? nextCursor : null);
    } catch (e) {
      setPickerErr(e instanceof Error ? e.message : "Failed to list notes.");
    } finally {
      setPickerLoading(false);
    }
  }

  function openPicker() {
    setPickerOpen(true);
    if (pickerNotes.length === 0) loadPickerPage();
  }

  async function runPrefill() {
    setPrefilling(true);
    setPrefillErr("");
    setPrefillResult(null);
    try {
      const res = await fetch("/api/admin/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ briefId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.message ?? "Pre-fill failed.");
      }
      const fields = Array.isArray(body.extractedFields)
        ? (body.extractedFields as string[])
        : [];
      setPrefillResult({ fields });
      // Surface the new formData on the brief editor without a hard reload.
      router.refresh();
    } catch (e) {
      setPrefillErr(e instanceof Error ? e.message : "Pre-fill failed.");
    } finally {
      setPrefilling(false);
    }
  }

  async function fetchTranscript() {
    if (!noteId) return;
    setTranscriptLoading(true);
    setTranscriptErr("");
    try {
      const res = await fetch(
        `/api/admin/granola/notes/${encodeURIComponent(noteId)}?include=transcript`
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message ?? "Failed to fetch transcript.");
      const note = body.note as GranolaNote;
      setLinkedNote(note);
      setTranscript(note.transcript ?? []);
    } catch (e) {
      setTranscriptErr(e instanceof Error ? e.message : "Failed to fetch transcript.");
    } finally {
      setTranscriptLoading(false);
    }
  }

  return (
    <section className="rounded-lg border border-mmc-border bg-white p-6 shadow-[0_1px_2px_rgba(42,18,48,0.04),0_8px_24px_-8px_rgba(42,18,48,0.12)] sm:p-8">
      <div className="mmc-kicker mb-2">Granola Note</div>
      <h2 className="mb-3 text-lg font-semibold text-mmc-purple">
        {noteId ? "Linked meeting note" : "Link a Granola note"}
      </h2>

      {!noteId ? (
        <>
          <p className="text-sm text-mmc-muted">
            Attach a Granola meeting note to this brief so context is one click away.
          </p>
          {!pickerOpen ? (
            <button
              type="button"
              onClick={openPicker}
              className="mt-5 inline-flex items-center gap-2 rounded-md bg-mmc-purple px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white transition hover:brightness-110"
            >
              <FileText size={14} aria-hidden="true" />
              Browse Granola Notes
            </button>
          ) : (
            <NotePicker
              notes={pickerNotes}
              loading={pickerLoading}
              err={pickerErr}
              hasMore={Boolean(pickerCursor)}
              onLoadMore={() => loadPickerPage(pickerCursor ?? undefined)}
              onPick={async (note) => {
                try {
                  await patchLink(note.id, "");
                  setPickerOpen(false);
                } catch (e) {
                  setPickerErr(e instanceof Error ? e.message : "Failed to link note.");
                }
              }}
              onCancel={() => setPickerOpen(false)}
            />
          )}
        </>
      ) : (
        <LinkedNoteView
          note={linkedNote}
          loading={linkedLoading}
          err={linkedErr}
          fallbackUrl={noteUrl}
          fallbackId={noteId}
          transcript={transcript}
          transcriptLoading={transcriptLoading}
          transcriptErr={transcriptErr}
          onFetchTranscript={fetchTranscript}
          prefilling={prefilling}
          prefillErr={prefillErr}
          prefillResult={prefillResult}
          onPrefill={runPrefill}
          onUnlink={async () => {
            if (!confirm("Unlink this Granola note from the brief?")) return;
            try {
              await patchLink("", "");
            } catch (e) {
              setLinkedErr(e instanceof Error ? e.message : "Failed to unlink.");
            }
          }}
        />
      )}
    </section>
  );
}

// ---------- Picker ----------

function NotePicker({
  notes,
  loading,
  err,
  hasMore,
  onLoadMore,
  onPick,
  onCancel,
}: {
  notes: GranolaNoteSummary[];
  loading: boolean;
  err: string;
  hasMore: boolean;
  onLoadMore: () => void;
  onPick: (note: GranolaNoteSummary) => void;
  onCancel: () => void;
}) {
  return (
    <div className="mt-5 rounded-md border border-mmc-border bg-mmc-cream/40">
      <div className="flex items-center justify-between border-b border-mmc-border px-4 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-mmc-muted">
          Recent Notes
        </span>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-mmc-muted underline hover:text-mmc-text"
        >
          Cancel
        </button>
      </div>
      {err ? (
        <div className="px-4 py-3 text-sm text-mmc-error">{err}</div>
      ) : null}
      {notes.length === 0 && loading ? (
        <div className="px-4 py-6 text-center text-sm text-mmc-muted">Loading…</div>
      ) : null}
      {notes.length === 0 && !loading && !err ? (
        <div className="px-4 py-6 text-center text-sm text-mmc-muted">
          No notes yet. Hold a meeting in Granola and they&apos;ll show up here.
        </div>
      ) : null}
      <ul className="max-h-96 divide-y divide-mmc-border overflow-y-auto">
        {notes.map((n) => (
          <li key={n.id}>
            <button
              type="button"
              onClick={() => onPick(n)}
              className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition hover:bg-white"
            >
              <span className="flex-1">
                <span className="block text-sm font-semibold text-mmc-text">
                  {n.title || "(untitled note)"}
                </span>
                <span className="mt-0.5 block text-xs text-mmc-muted">
                  {n.owner?.name || n.owner?.email || "Unknown owner"} ·{" "}
                  {new Date(n.created_at).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-mmc-purple">
                Link →
              </span>
            </button>
          </li>
        ))}
      </ul>
      {hasMore ? (
        <div className="border-t border-mmc-border px-4 py-2.5 text-center">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loading}
            className="text-xs font-medium text-mmc-purple underline hover:text-mmc-gold disabled:opacity-50"
          >
            {loading ? "Loading…" : "Load more"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

// ---------- Linked-note view ----------

function LinkedNoteView({
  note,
  loading,
  err,
  fallbackUrl,
  fallbackId,
  transcript,
  transcriptLoading,
  transcriptErr,
  onFetchTranscript,
  prefilling,
  prefillErr,
  prefillResult,
  onPrefill,
  onUnlink,
}: {
  note: GranolaNote | null;
  loading: boolean;
  err: string;
  fallbackUrl: string;
  fallbackId: string;
  transcript: GranolaNote["transcript"];
  transcriptLoading: boolean;
  transcriptErr: string;
  onFetchTranscript: () => void;
  prefilling: boolean;
  prefillErr: string;
  prefillResult: { fields: string[] } | null;
  onPrefill: () => void;
  onUnlink: () => void;
}) {
  const url = note?.web_url ?? fallbackUrl;
  const title = note?.title ?? "(loading…)";
  const id = note?.id ?? fallbackId;
  const created = note?.created_at;
  const summary = note?.summary_text;

  return (
    <div className="flex flex-col gap-4">
      {err ? (
        <div className="rounded-md border border-mmc-error/30 bg-mmc-error/5 p-3 text-sm text-mmc-error">
          {err}
        </div>
      ) : null}

      <div className="rounded-md border border-mmc-border bg-mmc-cream/40 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="text-sm font-semibold text-mmc-text">{loading ? "Loading…" : title}</div>
            <div className="mt-1 text-xs text-mmc-muted">
              {created
                ? new Date(created).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })
                : null}
              {created && id ? " · " : ""}
              <span className="font-mono">{id}</span>
            </div>
            {summary ? <p className="mt-3 text-xs text-mmc-text">{summary}</p> : null}
          </div>
          <div className="flex flex-col items-end gap-2">
            {url ? (
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-mmc-purple underline hover:text-mmc-gold"
              >
                Open <ExternalLink size={11} aria-hidden="true" />
              </a>
            ) : null}
            <button
              type="button"
              onClick={onUnlink}
              className="inline-flex items-center gap-1 rounded-md border border-mmc-border bg-white px-2.5 py-1 text-[11px] font-medium text-mmc-text hover:bg-mmc-cream"
            >
              <Link2Off size={11} aria-hidden="true" />
              Unlink
            </button>
          </div>
        </div>
      </div>

      {/* Pre-fill with Claude */}
      <div className="rounded-md border border-mmc-purple/30 bg-mmc-purple/[0.04] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <div className="mb-1 flex items-center gap-2">
              <Sparkles size={14} className="text-mmc-purple" aria-hidden="true" />
              <span className="text-sm font-semibold text-mmc-purple">
                Pre-fill brief from this note
              </span>
            </div>
            <p className="text-xs leading-relaxed text-mmc-muted">
              Claude reads the note&apos;s summary and transcript and fills in any
              brief fields it can confidently determine. Your existing edits are preserved.
            </p>
          </div>
          <button
            type="button"
            onClick={onPrefill}
            disabled={prefilling}
            className="inline-flex items-center gap-2 rounded-md bg-mmc-purple px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-mmc-gold focus:ring-offset-2 focus:ring-offset-white disabled:opacity-60"
          >
            {prefilling ? (
              <>
                <span
                  aria-hidden="true"
                  className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white"
                />
                Extracting…
              </>
            ) : (
              <>
                <Sparkles size={12} aria-hidden="true" />
                Pre-fill with Claude
              </>
            )}
          </button>
        </div>
        {prefillErr ? (
          <div className="mt-3 rounded-md border border-mmc-error/30 bg-mmc-error/5 p-2.5 text-xs text-mmc-error">
            {prefillErr}
          </div>
        ) : null}
        {prefillResult ? (
          <div className="mt-3 rounded-md border border-mmc-success/30 bg-mmc-success/[0.06] p-2.5 text-xs text-mmc-success">
            <div className="flex items-center gap-1.5">
              <Check size={12} aria-hidden="true" />
              {prefillResult.fields.length === 0
                ? "Claude couldn't find anything to extract from this note."
                : `Filled ${prefillResult.fields.length} field${
                    prefillResult.fields.length === 1 ? "" : "s"
                  }: ${prefillResult.fields.join(", ")}`}
            </div>
          </div>
        ) : null}
      </div>

      {/* Transcript */}
      <div className="rounded-md border border-mmc-border">
        <div className="flex items-center justify-between border-b border-mmc-border px-4 py-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-mmc-muted">
            Transcript
          </span>
          <button
            type="button"
            onClick={onFetchTranscript}
            disabled={transcriptLoading}
            className="inline-flex items-center gap-1.5 rounded-md border border-mmc-border bg-white px-2.5 py-1 text-[11px] font-medium text-mmc-text hover:bg-mmc-cream disabled:opacity-50"
          >
            <RefreshCw size={11} aria-hidden="true" className={transcriptLoading ? "animate-spin" : ""} />
            {transcript && transcript.length > 0 ? "Refresh" : "Fetch transcript"}
          </button>
        </div>
        {transcriptErr ? (
          <div className="px-4 py-3 text-sm text-mmc-error">{transcriptErr}</div>
        ) : null}
        {transcript == null ? (
          <div className="px-4 py-6 text-center text-xs text-mmc-muted">
            Fetch the transcript on demand. It is not stored — pulled from Granola each time.
          </div>
        ) : transcript.length === 0 ? (
          <div className="px-4 py-6 text-center text-xs text-mmc-muted">
            This note has no transcript turns yet.
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto px-4 py-3">
            {transcript.map((t, i) => (
              <div
                key={i}
                className="mb-3 last:mb-0 text-sm leading-relaxed text-mmc-text"
              >
                <span className="font-semibold text-mmc-purple">
                  {t.speaker?.diarization_label || "Speaker"}:
                </span>{" "}
                {t.text}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
