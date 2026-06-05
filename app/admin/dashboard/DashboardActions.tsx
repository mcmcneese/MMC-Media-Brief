"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Check, Trash2 } from "lucide-react";

interface DashboardActionsProps {
  briefId: string;
  token: string;
  baseUrl: string;
  companyName: string;
}

export default function DashboardActions({
  briefId,
  token,
  baseUrl,
  companyName,
}: DashboardActionsProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [err, setErr] = useState("");

  const link = token ? `${baseUrl}/form?token=${encodeURIComponent(token)}` : "";

  async function copyLink() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  async function doDelete() {
    setErr("");
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/briefs/${briefId}`, { method: "DELETE" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.success) {
        setErr(body?.message ?? "Delete failed.");
        return;
      }
      setConfirming(false);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Network error.");
    } finally {
      setDeleting(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center justify-end gap-2">
          <span className="text-xs text-mmc-text">
            Delete <strong>{companyName || "this brief"}</strong>?
          </span>
          <button
            type="button"
            onClick={doDelete}
            disabled={deleting}
            className="rounded-md bg-mmc-error px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Yes, delete"}
          </button>
          <button
            type="button"
            onClick={() => {
              setConfirming(false);
              setErr("");
            }}
            disabled={deleting}
            className="rounded-md border border-mmc-border bg-white px-3 py-1.5 text-xs font-medium text-mmc-text transition hover:bg-mmc-creamDeep/40 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
        {err ? <span className="text-xs text-mmc-error">{err}</span> : null}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Link
        href={`/admin/brief/${briefId}`}
        className="rounded-md border border-mmc-border bg-white px-3 py-1.5 text-xs font-medium text-mmc-text transition hover:bg-mmc-creamDeep/40"
      >
        Edit
      </Link>
      {token ? (
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex items-center gap-1.5 rounded-md border border-mmc-border bg-white px-3 py-1.5 text-xs font-medium text-mmc-text transition hover:bg-mmc-creamDeep/40"
          aria-label="Copy prospect link"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Copied" : "Copy link"}
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-1.5 rounded-md border border-mmc-error/30 bg-white px-3 py-1.5 text-xs font-medium text-mmc-error transition hover:bg-mmc-error/10"
        aria-label="Delete brief"
      >
        <Trash2 size={12} />
        Delete
      </button>
    </div>
  );
}
