"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import MMCLogo from "@/components/MMCLogo";

interface CachedDocx {
  filename: string;
  base64: string;
}

function base64ToBlobUrl(base64: string): string {
  const bin = atob(base64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  return URL.createObjectURL(blob);
}

function SuccessContent() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  // Try to recover the .docx from sessionStorage first (cached by /form/page on
  // successful submission). Falls back to /api/download/[token] which depends
  // on the in-memory store on the server.
  const [cached, setCached] = useState<CachedDocx | null>(null);
  const [blobUrl, setBlobUrl] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined" || !token) return;
    try {
      const raw = sessionStorage.getItem(`mmc_brief_docx_${token}`);
      if (raw) {
        const parsed = JSON.parse(raw) as CachedDocx;
        setCached(parsed);
        setBlobUrl(base64ToBlobUrl(parsed.base64));
      }
    } catch {
      /* ignore */
    }
    // Revoke object URL on unmount
    return () => {
      setBlobUrl((url) => {
        if (url) URL.revokeObjectURL(url);
        return "";
      });
    };
  }, [token]);

  const downloadHref = useMemo(() => {
    if (blobUrl) return blobUrl;
    return token ? `/api/download/${encodeURIComponent(token)}` : "";
  }, [blobUrl, token]);

  const downloadFilename = cached?.filename;

  return (
    <div className="flex min-h-screen flex-col items-center px-4">
      <header className="flex w-full max-w-[760px] items-end gap-4 pb-[22px] pt-9">
        <MMCLogo priority />
        <span className="flex-grow" />
        <span className="text-[15px] font-semibold">Media brief</span>
      </header>

      <main className="flex w-full max-w-[760px] flex-col">
        <div className="flex w-full flex-col items-start gap-4 rounded-3xl bg-white px-5 py-7 sm:px-9 sm:py-8">
          <span className="tl-pill">Brief received</span>
          <h1 className="text-[26px] font-semibold leading-8 tracking-[-0.02em]">Your brief is submitted</h1>
          <p className="max-w-[560px] text-[15px] leading-6 text-mmc-muted">
            Thank you. Our team will be in touch shortly to schedule a media strategy review.
          </p>
          <p className="max-w-[560px] text-[15px] leading-6 text-mmc-text">
            Please download a copy of your brief below for your records.
            A copy has also been sent to the MMC Media Strategy Team.
          </p>

          {downloadHref ? (
            <a
              href={downloadHref}
              download={downloadFilename}
              className="tl-btn tl-btn-primary mt-1"
            >
              Download your brief (.docx)
            </a>
          ) : (
            <p className="text-[13px] text-mmc-muted">
              No download token was provided. Please contact{" "}
              <a href="mailto:mediastrategy@mmc.us" className="underline">
                mediastrategy@mmc.us
              </a>{" "}
              to request a copy.
            </p>
          )}

          <p className="text-[13px] text-mmc-muted">
            {cached
              ? "Available for download from this page now."
              : "Download link is available for 24 hours."}
          </p>
        </div>
      </main>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div
            aria-label="Loading"
            className="h-8 w-8 animate-spin rounded-full border-2 border-mmc-border border-t-mmc-purple"
          />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
