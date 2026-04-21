"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import MMCLogo from "@/components/MMCLogo";

function SuccessContent() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const href = token ? `/api/download/${encodeURIComponent(token)}` : "";

  return (
    <div className="flex min-h-screen flex-col bg-mmc-bg">
      <header className="border-b border-mmc-border bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <MMCLogo height={32} priority />
          <div className="text-sm font-semibold tracking-wide text-mmc-text">MMC Media Brief</div>
          <span />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-1 items-center px-4 py-16 sm:px-6">
        <div className="w-full rounded-lg border border-mmc-border bg-white p-8 text-center shadow-sm sm:p-10">
          <div className="mb-5 flex justify-center">
            <CheckCircle2 size={56} color="#C9A961" strokeWidth={1.5} aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-semibold text-mmc-text">Brief Submitted Successfully</h1>
          <p className="mt-3 text-sm text-mmc-muted">
            Thank you. Our team will be in touch shortly to schedule a media strategy review.
          </p>

          {href ? (
            <a
              href={href}
              download
              className="mt-8 inline-flex w-full items-center justify-center rounded-md bg-mmc-accent px-6 py-3 text-sm font-semibold text-mmc-dark transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-mmc-dark focus:ring-offset-2 focus:ring-offset-white sm:w-auto"
            >
              Download Your Brief (.docx)
            </a>
          ) : (
            <p className="mt-6 text-xs text-mmc-muted">
              No download token was provided. Check your email for a copy of your brief.
            </p>
          )}

          <p className="mt-6 text-xs text-mmc-muted">
            A confirmation has also been sent to your email.
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
        <div className="flex min-h-screen items-center justify-center bg-mmc-bg">
          <div
            aria-label="Loading"
            className="h-8 w-8 animate-spin rounded-full border-2 border-mmc-border border-t-mmc-dark"
          />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
