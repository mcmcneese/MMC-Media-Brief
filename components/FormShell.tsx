"use client";

import { ReactNode, RefObject } from "react";
import MMCLogo from "./MMCLogo";
import ProgressBar from "./ProgressBar";
import { STEPS } from "@/lib/types";

interface FormShellProps {
  step: number;
  title: string;
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
    <div className="flex min-h-screen flex-col bg-mmc-bg">
      {/* Top header */}
      <header className="sticky top-0 z-20 w-full border-b border-mmc-border bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <MMCLogo height={32} priority />
          </div>
          <div className="hidden text-sm font-semibold tracking-wide text-mmc-text sm:block">
            MMC Media Brief
          </div>
          <div className="text-xs font-medium text-mmc-muted sm:text-sm">
            Step {step + 1} of {STEPS.length}
          </div>
        </div>
        <ProgressBar step={step} />
      </header>

      {/* Hero (only on first step typically) */}
      {hero}

      {/* Anchor for scroll-into-view from the hero CTA */}
      <div ref={formAnchorRef} aria-hidden="true" />

      {/* Main: sidebar + form card */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-32 sm:px-6">
        <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
          {sidebar ? (
            <aside className="hidden lg:block lg:pt-8" aria-label="Brief navigation">
              {sidebar}
            </aside>
          ) : null}

          <div className="pt-8">
            <h2 className="mb-6 text-xl font-semibold text-mmc-text sm:text-2xl">{title}</h2>
            <div className="rounded-lg border border-mmc-border bg-white p-5 shadow-sm sm:p-8">
              {children}
            </div>
          </div>
        </div>
      </main>

      {/* Sticky footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-20 border-t border-mmc-border bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              disabled={isSubmitting}
              className="rounded-md border border-mmc-border bg-transparent px-5 py-3 text-sm font-medium text-mmc-text transition hover:bg-mmc-bg focus:outline-none focus:ring-2 focus:ring-mmc-accent focus:ring-offset-2 focus:ring-offset-white disabled:opacity-50"
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
            className={`rounded-md px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-mmc-accent focus:ring-offset-2 focus:ring-offset-white disabled:opacity-60 ${
              nextLabel === "Submit Brief" ? "bg-mmc-accent" : "bg-mmc-dark"
            }`}
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
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
