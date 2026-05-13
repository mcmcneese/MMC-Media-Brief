"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check } from "lucide-react";
import type { BriefRecord, BriefStatus } from "@/lib/airtable";
import GranolaNoteCard from "@/components/admin/GranolaNoteCard";

interface BriefEditorClientProps {
  initialRecord: BriefRecord;
  prospectLink: string;
}

const STATUSES: BriefStatus[] = ["Draft", "Sent", "Submitted", "Expired"];

export default function BriefEditorClient({
  initialRecord,
  prospectLink,
}: BriefEditorClientProps) {
  const router = useRouter();
  const [record, setRecord] = useState<BriefRecord>(initialRecord);
  const [companyName, setCompanyName] = useState(initialRecord.companyName);
  const [prospectName, setProspectName] = useState(initialRecord.prospectName);
  const [prospectEmail, setProspectEmail] = useState(initialRecord.prospectEmail);
  const [adminNotes, setAdminNotes] = useState(initialRecord.adminNotes);
  const [status, setStatus] = useState<BriefStatus>(initialRecord.status);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  async function patch(patchBody: Record<string, unknown>) {
    setErr("");
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/briefs/${initialRecord.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchBody),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(body?.message ?? "Failed to save.");
        return null;
      }
      setRecord(body.record as BriefRecord);
      setSavedAt(Date.now());
      router.refresh();
      return body.record as BriefRecord;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Network error.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function onSave() {
    await patch({
      companyName,
      prospectName,
      prospectEmail,
      adminNotes,
      status,
    });
  }

  async function onMarkSent() {
    const updated = await patch({
      companyName,
      prospectName,
      prospectEmail,
      adminNotes,
      markSent: true,
    });
    if (updated) setStatus(updated.status);
  }

  async function copyLink() {
    if (!prospectLink) return;
    try {
      await navigator.clipboard.writeText(prospectLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Prospect link card */}
      <section className="rounded-lg border border-mmc-border bg-white p-6 shadow-[0_1px_2px_rgba(42,18,48,0.04),0_8px_24px_-8px_rgba(42,18,48,0.12)] sm:p-8">
        <div className="mmc-kicker mb-2">Prospect Link</div>
        <h2 className="mb-3 text-lg font-semibold text-mmc-purple">Share this URL with the prospect</h2>
        {prospectLink ? (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                readOnly
                value={prospectLink}
                onClick={(e) => (e.currentTarget as HTMLInputElement).select()}
                className="w-full flex-1 rounded-md border border-mmc-border bg-mmc-cream px-3 py-2 text-xs text-mmc-text outline-none"
              />
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex items-center gap-1.5 rounded-md bg-mmc-purple px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white transition hover:brightness-110"
              >
                {linkCopied ? <Check size={12} /> : <Copy size={12} />}
                {linkCopied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-mmc-muted">
                Status: <strong className="text-mmc-text">{record.status}</strong>
              </span>
              {record.status !== "Sent" && record.status !== "Submitted" ? (
                <button
                  type="button"
                  onClick={onMarkSent}
                  disabled={busy}
                  className="rounded-md border border-mmc-purple bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-mmc-purple transition hover:bg-mmc-purple hover:text-white disabled:opacity-50"
                >
                  Mark Sent
                </button>
              ) : null}
            </div>
          </>
        ) : (
          <p className="text-sm text-mmc-muted">
            No token on this brief yet. Save once to generate one.
          </p>
        )}
      </section>

      {/* Editable fields */}
      <section className="rounded-lg border border-mmc-border bg-white p-6 shadow-[0_1px_2px_rgba(42,18,48,0.04),0_8px_24px_-8px_rgba(42,18,48,0.12)] sm:p-8">
        <div className="mmc-kicker mb-2">Brief Details</div>
        <h2 className="mb-5 text-lg font-semibold text-mmc-purple">Edit</h2>

        <div className="flex flex-col gap-5">
          <Field label="Company Name" required value={companyName} onChange={setCompanyName} />
          <Field label="Primary Contact Name" value={prospectName} onChange={setProspectName} />
          <Field
            label="Primary Contact Email"
            type="email"
            value={prospectEmail}
            onChange={setProspectEmail}
          />

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-mmc-text">Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as BriefStatus)}
              className="w-full rounded-md border border-mmc-border bg-white px-4 py-3 text-mmc-text outline-none transition focus:border-mmc-purple focus:ring-2 focus:ring-mmc-gold focus:ring-offset-2 focus:ring-offset-white"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <FieldArea label="Admin Notes (internal)" value={adminNotes} onChange={setAdminNotes} />

          {err ? (
            <div role="alert" className="rounded-md border border-mmc-error/30 bg-mmc-error/5 p-3 text-sm text-mmc-error">
              {err}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-3 pt-2">
            {savedAt ? (
              <span className="text-xs text-mmc-muted">
                Saved at {new Date(savedAt).toLocaleTimeString()}
              </span>
            ) : null}
            <button
              type="button"
              onClick={onSave}
              disabled={busy}
              className="rounded-md bg-mmc-purple px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white transition hover:brightness-110 disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </section>

      {/* Granola note linkage */}
      <GranolaNoteCard
        briefId={initialRecord.id}
        initialNoteId={record.granolaNoteId}
        initialNoteUrl={record.granolaNoteUrl}
        onUpdate={({ granolaNoteId, granolaNoteUrl }) => {
          setRecord((r) => ({ ...r, granolaNoteId, granolaNoteUrl }));
          router.refresh();
        }}
      />

      {/* Read-only summary of the form_data, if any */}
      {record.formData ? (
        <section className="rounded-lg border border-mmc-border bg-white p-6 shadow-[0_1px_2px_rgba(42,18,48,0.04),0_8px_24px_-8px_rgba(42,18,48,0.12)] sm:p-8">
          <div className="mmc-kicker mb-2">Submitted Form Data</div>
          <h2 className="mb-3 text-lg font-semibold text-mmc-purple">Brief content (read-only)</h2>
          <pre className="overflow-x-auto rounded-md border border-mmc-border bg-mmc-cream p-4 text-[11px] leading-relaxed text-mmc-text">
            {JSON.stringify(record.formData, null, 2)}
          </pre>
        </section>
      ) : null}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: "text" | "email" | "url";
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-mmc-text">
        {label}
        {required ? <span aria-hidden="true" className="text-mmc-error"> *</span> : null}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full rounded-md border border-mmc-border bg-white px-4 py-3 text-mmc-text outline-none transition focus:border-mmc-purple focus:ring-2 focus:ring-mmc-gold focus:ring-offset-2 focus:ring-offset-white"
      />
    </label>
  );
}

function FieldArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-mmc-text">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="w-full resize-y rounded-md border border-mmc-border bg-white px-4 py-3 text-mmc-text outline-none transition focus:border-mmc-purple focus:ring-2 focus:ring-mmc-gold focus:ring-offset-2 focus:ring-offset-white"
      />
    </label>
  );
}
