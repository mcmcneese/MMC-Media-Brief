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
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-mmc-border/70 bg-mmc-cream/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
          <MMCLogo height={56} priority />
          <span className="hidden text-xs font-semibold uppercase tracking-[0.18em] text-mmc-gold md:block">
            Media Brief
          </span>
          <span />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-1 items-center px-4 py-16 sm:px-6">
        <div className="w-full rounded-lg border border-mmc-border bg-white p-8 text-center shadow-[0_1px_2px_rgba(42,18,48,0.04),0_12px_32px_-12px_rgba(42,18,48,0.18)] sm:p-10">
          <div className="mb-5 flex justify-center">
            <CheckCircle2 size={64} color="#5D2B5E" strokeWidth={1.5} aria-hidden="true" />
          </div>
          <div className="mb-2 flex items-center justify-center">
            <span className="mmc-kicker">Brief Received</span>
          </div>
          <h1 className="text-2xl font-bold text-mmc-purple sm:text-3xl">
            Brief Submitted <span className="text-mmc-gold">Successfully</span>
          </h1>
          <div className="mt-3 flex justify-center">
            <span className="mmc-rule" />
          </div>
          <p className="mt-5 text-sm leading-relaxed text-mmc-muted">
            Thank you. Our team will be in touch shortly to schedule a media strategy review.
          </p>

          {href ? (
            <a
              href={href}
              download
              className="mt-8 inline-flex w-full items-center justify-center rounded-md bg-mmc-purple px-7 py-3.5 text-sm font-semibold uppercase tracking-wider text-white transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-mmc-gold focus:ring-offset-2 focus:ring-offset-white sm:w-auto"
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
