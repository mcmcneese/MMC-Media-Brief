"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, Sparkles } from "lucide-react";
import type { BriefRecord, BriefStatus } from "@/lib/airtable";
import type { FormData, MultiSelectValue } from "@/lib/types";
import { EMPTY_FORM_DATA } from "@/lib/types";
import GranolaNoteCard from "@/components/admin/GranolaNoteCard";

interface BriefEditorClientProps {
  initialRecord: BriefRecord;
  prospectLink: string;
}

const STATUSES: BriefStatus[] = ["Draft", "Sent", "Submitted", "Expired"];

const REGULATION_OPTIONS = [
  "Health/medical claims",
  "Financial services",
  "Alcohol",
  "Cannabis/CBD",
  "Supplements",
  "Political",
  "Gambling",
  "Children's products",
  "None",
  "Other",
];

const CREATIVE_OPTIONS = [
  "Linear Video",
  "CTV Video",
  "Digital Display",
  "Custom Content",
  "Social",
  "OOH",
  "Other",
];

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

  // Full editable brief content.
  const [formData, setFormData] = useState<FormData>({
    ...EMPTY_FORM_DATA,
    ...(initialRecord.formData ?? {}),
  });
  const [formBusy, setFormBusy] = useState(false);
  const [formSavedAt, setFormSavedAt] = useState<number | null>(null);
  const [formErr, setFormErr] = useState("");

  // Pre-fill (Claude extraction) card.
  const [pasteText, setPasteText] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [prefillBusy, setPrefillBusy] = useState(false);
  const [prefillMsg, setPrefillMsg] = useState("");
  const [prefillErr, setPrefillErr] = useState("");

  function setField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setFormData((d) => ({ ...d, [key]: value }));
  }

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

  async function onSaveFormData() {
    setFormErr("");
    setFormBusy(true);
    try {
      const res = await fetch(`/api/admin/briefs/${initialRecord.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormErr(body?.message ?? "Failed to save brief content.");
        return;
      }
      const updated = body.record as BriefRecord;
      setRecord(updated);
      if (updated.formData) {
        setFormData({ ...EMPTY_FORM_DATA, ...updated.formData });
      }
      setFormSavedAt(Date.now());
      router.refresh();
    } catch (e) {
      setFormErr(e instanceof Error ? e.message : "Network error.");
    } finally {
      setFormBusy(false);
    }
  }

  async function onPrefill() {
    setPrefillErr("");
    setPrefillMsg("");
    const text = pasteText.trim();
    const url = shareUrl.trim();
    if (!text && !url) {
      setPrefillErr("Paste meeting notes or a Granola share link first.");
      return;
    }
    setPrefillBusy(true);
    try {
      const res = await fetch(`/api/admin/extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          briefId: initialRecord.id,
          ...(text ? { text } : {}),
          ...(!text && url ? { shareUrl: url } : {}),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.success) {
        setPrefillErr(body?.message ?? "Pre-fill failed.");
        return;
      }
      // The endpoint merges extracted data into the brief and returns the
      // updated record. Refresh local state from it.
      const updated = body.record as BriefRecord | undefined;
      if (updated) {
        setRecord(updated);
        if (updated.formData) {
          setFormData({ ...EMPTY_FORM_DATA, ...updated.formData });
        }
        setCompanyName(updated.companyName);
        setProspectName(updated.prospectName);
        setProspectEmail(updated.prospectEmail);
      }
      const count = body.extractedFieldCount ?? 0;
      const via = body.usedShareUrl
        ? " from the share link"
        : body.usedGranola
        ? " from the linked Granola note"
        : "";
      setPrefillMsg(
        `Claude filled ${count} field${count === 1 ? "" : "s"}${via}. Review below, then Save Brief Content.`
      );
      router.refresh();
    } catch (e) {
      setPrefillErr(e instanceof Error ? e.message : "Network error.");
    } finally {
      setPrefillBusy(false);
    }
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

      {/* Editable top-level fields */}
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

      {/* Pre-fill from notes / share link */}
      <section className="rounded-lg border border-mmc-gold/40 bg-mmc-gold/5 p-6 shadow-[0_1px_2px_rgba(42,18,48,0.04),0_8px_24px_-8px_rgba(42,18,48,0.12)] sm:p-8">
        <div className="mmc-kicker mb-2">AI Pre-fill</div>
        <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-mmc-purple">
          <Sparkles size={18} className="text-mmc-gold" />
          Pre-fill the brief from meeting notes
        </h2>
        <p className="mb-4 text-sm text-mmc-muted">
          Paste raw notes/transcript (most reliable), or a public Granola share link. Claude will
          extract the brief fields and fill them in below for you to review.
        </p>

        <div className="flex flex-col gap-4">
          <FieldArea
            label="Paste meeting notes or transcript"
            value={pasteText}
            onChange={setPasteText}
            rows={8}
            placeholder="Paste the Granola notes / transcript here…"
          />

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-mmc-border" />
            <span className="text-xs uppercase tracking-wider text-mmc-muted">or</span>
            <div className="h-px flex-1 bg-mmc-border" />
          </div>

          <Field
            label="Granola share link (public URL)"
            type="url"
            value={shareUrl}
            onChange={setShareUrl}
            placeholder="https://notes.granola.ai/…"
          />

          {prefillErr ? (
            <div role="alert" className="rounded-md border border-mmc-error/30 bg-mmc-error/5 p-3 text-sm text-mmc-error">
              {prefillErr}
            </div>
          ) : null}
          {prefillMsg ? (
            <div className="rounded-md border border-mmc-purple/20 bg-mmc-purple/5 p-3 text-sm text-mmc-purple">
              {prefillMsg}
            </div>
          ) : null}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onPrefill}
              disabled={prefillBusy}
              className="inline-flex items-center gap-1.5 rounded-md bg-mmc-gold px-5 py-2 text-xs font-semibold uppercase tracking-wider text-mmc-purple transition hover:brightness-105 disabled:opacity-50"
            >
              <Sparkles size={12} />
              {prefillBusy ? "Extracting…" : "Pre-fill with Claude"}
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

      {/* Editable brief content (formData) */}
      <section className="rounded-lg border border-mmc-border bg-white p-6 shadow-[0_1px_2px_rgba(42,18,48,0.04),0_8px_24px_-8px_rgba(42,18,48,0.12)] sm:p-8">
        <div className="mmc-kicker mb-2">Brief Content</div>
        <h2 className="mb-5 text-lg font-semibold text-mmc-purple">Edit brief content</h2>

        <div className="flex flex-col gap-8">
          {/* Contact */}
          <FormSection title="Contact">
            <Field label="Contact Name" value={formData.contactName} onChange={(v) => setField("contactName", v)} />
            <Field label="Contact Email" type="email" value={formData.contactEmail} onChange={(v) => setField("contactEmail", v)} />
          </FormSection>

          {/* Company Information */}
          <FormSection title="Company Information">
            <Field label="Company Name" value={formData.companyName} onChange={(v) => setField("companyName", v)} />
            <Field label="Company Website" type="url" value={formData.companyWebsite} onChange={(v) => setField("companyWebsite", v)} />
            <FieldArea label="Company Description" value={formData.companyDescription} onChange={(v) => setField("companyDescription", v)} />
            <FieldArea label="Unique Selling Proposition (USP)" value={formData.usp} onChange={(v) => setField("usp", v)} />
            <FieldArea label="Differentiators" value={formData.differentiators} onChange={(v) => setField("differentiators", v)} />
            <Field label="Competitor 1" value={formData.competitor1} onChange={(v) => setField("competitor1", v)} />
            <Field label="Competitor 2" value={formData.competitor2} onChange={(v) => setField("competitor2", v)} />
            <Field label="Competitor 3" value={formData.competitor3} onChange={(v) => setField("competitor3", v)} />
            <FieldArea label="Pricing" value={formData.pricing} onChange={(v) => setField("pricing", v)} />
            <FieldArea label="Availability" value={formData.availability} onChange={(v) => setField("availability", v)} />
            <MultiSelectField
              label="Regulations"
              options={REGULATION_OPTIONS}
              value={formData.regulations}
              onChange={(v) => setField("regulations", v)}
            />
            <NumberField label="Lifetime Value (LTV)" value={formData.ltv} onChange={(v) => setField("ltv", v)} />
          </FormSection>

          {/* Audience Details */}
          <FormSection title="Audience Details">
            <FieldArea label="Target Consumer" value={formData.targetConsumer} onChange={(v) => setField("targetConsumer", v)} />
            <SelectField
              label="Business Type"
              options={["", "B2B", "B2C", "Mix of both"]}
              value={formData.businessType}
              onChange={(v) => setField("businessType", v as FormData["businessType"])}
            />
            <Field label="Geographic Focus" value={formData.geographicFocus} onChange={(v) => setField("geographicFocus", v)} />
            <FieldArea label="Interests and Habits" value={formData.interestsAndHabits} onChange={(v) => setField("interestsAndHabits", v)} />
            <FieldArea label="Additional Personas" value={formData.additionalPersonas} onChange={(v) => setField("additionalPersonas", v)} />
          </FormSection>

          {/* Past and Present Paid Media */}
          <FormSection title="Past & Present Paid Media">
            <SelectField
              label="Has Advertised Before"
              options={["", "Yes", "No"]}
              value={formData.hasAdvertised}
              onChange={(v) => setField("hasAdvertised", v as FormData["hasAdvertised"])}
            />
            <FieldArea label="Past Vendors" value={formData.pastVendors} onChange={(v) => setField("pastVendors", v)} />
            <FieldArea label="What Worked" value={formData.whatWorked} onChange={(v) => setField("whatWorked", v)} />
            <FieldArea label="What Didn't Work" value={formData.whatDidntWork} onChange={(v) => setField("whatDidntWork", v)} />
            <Field label="Past Geography" value={formData.pastGeo} onChange={(v) => setField("pastGeo", v)} />
            <MultiSelectField
              label="Past Creative"
              options={CREATIVE_OPTIONS}
              value={formData.pastCreative}
              onChange={(v) => setField("pastCreative", v)}
            />
            <FieldArea label="Past Goal" value={formData.pastGoal} onChange={(v) => setField("pastGoal", v)} />
          </FormSection>

          {/* MMC Campaign Set Up */}
          <FormSection title="MMC Campaign Set Up">
            <SelectField
              label="Primary Goal"
              options={["", "Brand Awareness", "Product Consideration", "Acquisition"]}
              value={formData.primaryGoal}
              onChange={(v) => setField("primaryGoal", v as FormData["primaryGoal"])}
            />
            <FieldArea label="KPIs" value={formData.kpis} onChange={(v) => setField("kpis", v)} />
            <FieldArea label="Definition of Success" value={formData.successDefinition} onChange={(v) => setField("successDefinition", v)} />
            <FieldArea label="Tracking Technology" value={formData.trackingTech} onChange={(v) => setField("trackingTech", v)} />
            <FieldArea label="Seasonality" value={formData.seasonality} onChange={(v) => setField("seasonality", v)} />
            <FieldArea label="Channel Preferences" value={formData.channelPreferences} onChange={(v) => setField("channelPreferences", v)} />
            <Field label="Start Date" type="date" value={formData.startDate} onChange={(v) => setField("startDate", v)} />
            <Field label="End Date" type="date" value={formData.endDate} onChange={(v) => setField("endDate", v)} />
            <NumberField label="Budget" value={formData.budget} onChange={(v) => setField("budget", v)} />
            <SelectField
              label="Has TV Commercial"
              options={["", "Yes", "No"]}
              value={formData.hasTVCommercial}
              onChange={(v) => setField("hasTVCommercial", v as FormData["hasTVCommercial"])}
            />
            <SelectField
              label="Has Display Ads"
              options={["", "Yes", "No"]}
              value={formData.hasDisplayAds}
              onChange={(v) => setField("hasDisplayAds", v as FormData["hasDisplayAds"])}
            />
          </FormSection>

          {formErr ? (
            <div role="alert" className="rounded-md border border-mmc-error/30 bg-mmc-error/5 p-3 text-sm text-mmc-error">
              {formErr}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-3 border-t border-mmc-border pt-5">
            {formSavedAt ? (
              <span className="text-xs text-mmc-muted">
                Saved at {new Date(formSavedAt).toLocaleTimeString()}
              </span>
            ) : null}
            <button
              type="button"
              onClick={onSaveFormData}
              disabled={formBusy}
              className="rounded-md bg-mmc-purple px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white transition hover:brightness-110 disabled:opacity-50"
            >
              {formBusy ? "Saving…" : "Save Brief Content"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-mmc-gold">{title}</h3>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: "text" | "email" | "url" | "date";
  required?: boolean;
  placeholder?: string;
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
        placeholder={placeholder}
        className="w-full rounded-md border border-mmc-border bg-white px-4 py-3 text-mmc-text outline-none transition focus:border-mmc-purple focus:ring-2 focus:ring-mmc-gold focus:ring-offset-2 focus:ring-offset-white"
      />
    </label>
  );
}

function FieldArea({
  label,
  value,
  onChange,
  rows = 4,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-mmc-text">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full resize-y rounded-md border border-mmc-border bg-white px-4 py-3 text-mmc-text outline-none transition focus:border-mmc-purple focus:ring-2 focus:ring-mmc-gold focus:ring-offset-2 focus:ring-offset-white"
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-mmc-text">{label}</span>
      <input
        type="number"
        value={value === null ? "" : String(value)}
        onChange={(e) => {
          const raw = e.target.value.trim();
          if (raw === "") {
            onChange(null);
            return;
          }
          const n = Number(raw);
          onChange(Number.isFinite(n) ? n : null);
        }}
        className="w-full rounded-md border border-mmc-border bg-white px-4 py-3 text-mmc-text outline-none transition focus:border-mmc-purple focus:ring-2 focus:ring-mmc-gold focus:ring-offset-2 focus:ring-offset-white"
      />
    </label>
  );
}

function SelectField({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-mmc-text">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-mmc-border bg-white px-4 py-3 text-mmc-text outline-none transition focus:border-mmc-purple focus:ring-2 focus:ring-mmc-gold focus:ring-offset-2 focus:ring-offset-white"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o === "" ? "— Not set —" : o}
          </option>
        ))}
      </select>
    </label>
  );
}

function MultiSelectField({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: MultiSelectValue;
  onChange: (v: MultiSelectValue) => void;
}) {
  const selected = value?.selected ?? [];
  const other = value?.other ?? "";
  const showOther = selected.includes("Other");

  function toggle(option: string) {
    const next = selected.includes(option)
      ? selected.filter((o) => o !== option)
      : [...selected, option];
    onChange({ selected: next, other: next.includes("Other") ? other : "" });
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-mmc-text">{label}</span>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {options.map((o) => (
          <label key={o} className="flex items-center gap-2 text-sm text-mmc-text">
            <input
              type="checkbox"
              checked={selected.includes(o)}
              onChange={() => toggle(o)}
              className="h-4 w-4 rounded border-mmc-border text-mmc-purple focus:ring-mmc-gold"
            />
            {o}
          </label>
        ))}
      </div>
      {showOther ? (
        <input
          type="text"
          value={other}
          placeholder="Other (please specify)"
          onChange={(e) => onChange({ selected, other: e.target.value })}
          className="mt-1 w-full rounded-md border border-mmc-border bg-white px-4 py-2 text-mmc-text outline-none transition focus:border-mmc-purple focus:ring-2 focus:ring-mmc-gold focus:ring-offset-2 focus:ring-offset-white"
        />
      ) : null}
    </div>
  );
}
