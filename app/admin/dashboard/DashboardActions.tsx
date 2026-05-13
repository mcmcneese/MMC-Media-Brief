"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, Check } from "lucide-react";

interface DashboardActionsProps {
  briefId: string;
  token: string;
  baseUrl: string;
}

export default function DashboardActions({ briefId, token, baseUrl }: DashboardActionsProps) {
  const [copied, setCopied] = useState(false);

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
    </div>
  );
}
