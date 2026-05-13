"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function NewBriefClient() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [prospectName, setProspectName] = useState("");
  const [prospectEmail, setProspectEmail] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    if (!companyName.trim()) {
      setErr("Company name is required.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/briefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          prospectName,
          prospectEmail,
          adminNotes,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(body?.message ?? "Failed to create brief.");
        return;
      }
      const id = body?.record?.id as string | undefined;
      if (id) {
        router.replace(`/admin/brief/${id}`);
        router.refresh();
      } else {
        router.replace("/admin/dashboard");
        router.refresh();
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-5 rounded-lg border border-mmc-border bg-white p-6 shadow-[0_1px_2px_rgba(42,18,48,0.04),0_8px_24px_-8px_rgba(42,18,48,0.12)] sm:p-8"
      noValidate
    >
      <Field
        label="Company Name"
        required
        value={companyName}
        onChange={setCompanyName}
        placeholder="e.g. Copper"
      />
      <Field
        label="Primary Contact Name"
        value={prospectName}
        onChange={setProspectName}
        placeholder="e.g. Jane Doe"
      />
      <Field
        label="Primary Contact Email"
        type="email"
        value={prospectEmail}
        onChange={setProspectEmail}
        placeholder="jane@copper.com"
      />
      <FieldArea
        label="Admin Notes (internal)"
        value={adminNotes}
        onChange={setAdminNotes}
        placeholder="Anything to remember about this prospect for our team."
      />

      {err ? (
        <div role="alert" className="rounded-md border border-mmc-error/30 bg-mmc-error/5 p-3 text-sm text-mmc-error">
          {err}
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={() => router.replace("/admin/dashboard")}
          disabled={busy}
          className="rounded-md border border-mmc-border bg-white px-4 py-2 text-xs font-medium text-mmc-text transition hover:bg-mmc-creamDeep/40 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-mmc-purple px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white transition hover:brightness-110 disabled:opacity-50"
        >
          {busy ? "Creating…" : "Create Brief"}
        </button>
      </div>
    </form>
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
  type?: "text" | "email" | "url";
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
        placeholder={placeholder}
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
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-mmc-text">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full resize-y rounded-md border border-mmc-border bg-white px-4 py-3 text-mmc-text outline-none transition focus:border-mmc-purple focus:ring-2 focus:ring-mmc-gold focus:ring-offset-2 focus:ring-offset-white"
      />
    </label>
  );
}
