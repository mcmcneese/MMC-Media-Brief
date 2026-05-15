"use client";

import { ReactNode, RefObject } from "react";
import MMCLogo from "./MMCLogo";
import ProgressBar from "./ProgressBar";
import { STEPS } from "@/lib/types";

interface FormShellProps {
  step: number;
  title: string;
  kicker?: string;
  onBack?: () => void;
  onNext: () => void;
  backLabel?: string;
  nextLabel: string;
  isSubmitting?: boolean;
  hero?: ReactNode;
  sidebar?: ReactNode;
  formAnchorRef?: RefObject<HTMLDivElement>;
  children: ReactNode;
}

export default function FormShell({
  step,
  title,
  kicker,
  onBack,
  onNext,
  backLabel = "Back",
  nextLabel,
  isSubmitting = false,
  hero,
  sidebar,
  formAnchorRef,
  children,
}: FormShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Top header — sits over the cream body (no opaque white fill) */}
      <header className="sticky top-0 z-20 w-full border-b border-mmc-border/70 bg-mmc-cream/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
          <div className="flex items-center gap-3">
            <MMCLogo height={64} priority />
          </div>
          <div className="hidden text-xs font-semibold uppercase tracking-[0.18em] text-mmc-gold md:block">
            Media Brief
          </div>
          <div className="text-xs font-medium uppercase tracking-wider text-mmc-muted sm:text-sm">
            Step {step + 1} of {STEPS.length}
          </div>
        </div>
        <ProgressBar step={step} />
      </header>

      {/* Hero (only on first step) */}
      {hero}

      {/* Anchor for scroll-into-view from the hero CTA */}
      <div ref={formAnchorRef} aria-hidden="true" />

      {/* Main: sidebar + form card */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 sm:px-8">
        <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
          {sidebar ? (
            <aside className="hidden lg:block lg:pt-10" aria-label="Brief navigation">
              {sidebar}
            </aside>
          ) : null}

          <div className="pt-8 sm:pt-10">
            {/* Kicker + big purple H1 + gold rule (deck style) */}
            <div className="mb-6 sm:mb-8">
              {kicker ? <div className="mmc-kicker mb-3">{kicker}</div> : null}
              <h2 className="text-3xl font-bold tracking-tight text-mmc-purple sm:text-4xl">
                {title}
              </h2>
              <span className="mmc-rule mt-4" />
            </div>

            {/* White form card */}
            <div className="rounded-lg border border-mmc-border bg-white p-5 shadow-[0_1px_2px_rgba(42,18,48,0.04),0_8px_24px_-8px_rgba(42,18,48,0.12)] sm:p-8">
              {children}
            </div>
          </div>
        </div>
      </main>

      {/* Sticky footer — compact */}
      <footer className="fixed bottom-0 left-0 right-0 z-20 border-t border-mmc-border/70 bg-mmc-cream/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 sm:px-8">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              disabled={isSubmitting}
              className="rounded-md border border-mmc-border bg-white/60 px-3.5 py-1.5 text-xs font-medium text-mmc-text transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-mmc-gold focus:ring-offset-2 focus:ring-offset-mmc-cream disabled:opacity-50"
            >
              {backLabel}
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onNext}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 rounded-md bg-mmc-purple px-5 py-1.5 text-xs font-semibold uppercase tracking-wider text-white transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-mmc-gold focus:ring-offset-2 focus:ring-offset-mmc-cream disabled:opacity-60"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white"
                />
                Submitting…
              </span>
            ) : (
              nextLabel
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}
