"use client";

import { ReactNode } from "react";
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
  children,
}: FormShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-mmc-bg">
      {/* Top header */}
      <header className="sticky top-0 z-20 w-full border-b border-mmc-border bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
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

      {/* Main content */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-32 pt-8 sm:px-6">
        <h1 className="mb-6 text-xl font-semibold text-mmc-text sm:text-2xl">{title}</h1>
        <div className="rounded-lg border border-mmc-border bg-white p-5 shadow-sm sm:p-8">
          {children}
        </div>
      </main>

      {/* Sticky footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-20 border-t border-mmc-border bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
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
            className={`rounded-md px-6 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-mmc-accent focus:ring-offset-2 focus:ring-offset-white disabled:opacity-60 ${
              nextLabel === "Submit Brief"
                ? "bg-mmc-accent text-mmc-dark hover:brightness-95"
                : "bg-mmc-dark text-white hover:brightness-110"
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
