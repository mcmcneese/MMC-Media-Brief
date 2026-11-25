"use client";

import { ReactNode } from "react";
import TalariaLockup, { TalariaBands } from "./TalariaLockup";
import { STEPS } from "@/lib/types";

interface FormShellProps {
  step: number;
  title: string;
  intro?: string;
  /** "Saved 10:02 AM", or empty before the first save. */
  savedLabel?: string;
  /** Steps that still have a required answer missing. */
  incompleteSteps?: number[];
  onJump: (step: number) => void;
  onBack?: () => void;
  onNext: () => void;
  onSaveExit?: () => void;
  nextLabel: string;
  isSubmitting?: boolean;
  children: ReactNode;
}

export default function FormShell({
  step,
  title,
  intro,
  savedLabel = "",
  incompleteSteps = [],
  onJump,
  onBack,
  onNext,
  onSaveExit,
  nextLabel,
  isSubmitting = false,
  children,
}: FormShellProps) {
  return (
    <div className="flex min-h-screen flex-col items-center px-4">
      <header className="flex w-full max-w-[760px] items-end gap-4 pb-[22px] pt-9">
        <TalariaLockup />
        <span className="flex-grow" />
        <span className="text-[15px] font-semibold">Media brief</span>
      </header>

      <main className="flex w-full max-w-[760px] flex-col gap-5 rounded-3xl bg-white px-5 py-7 sm:px-9 sm:py-8">
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2.5">
            <span className="tl-label">
              Step {step + 1} of {STEPS.length}
            </span>
            <span className="flex-grow" />
            <span className="tl-label !text-mmc-muted" aria-live="polite">
              {savedLabel}
            </span>
          </div>
          {/* Each bar is a step. Any step can be opened at any time. */}
          <nav aria-label="Brief sections" className="flex gap-1.5">
            {STEPS.map((s) => {
              const done = s.index < step || (s.index !== step && !incompleteSteps.includes(s.index) && s.index < STEPS.length - 1 && step > s.index);
              const here = s.index === step;
              return (
                <button
                  key={s.index}
                  type="button"
                  onClick={() => onJump(s.index)}
                  aria-current={here ? "step" : undefined}
                  aria-label={`${s.name}${here ? ", current section" : ""}`}
                  title={s.name}
                  className="group flex h-5 flex-1 items-center focus:outline-none"
                >
                  <span
                    className={`block h-2 w-full rounded transition group-hover:opacity-80 group-focus-visible:ring-2 group-focus-visible:ring-mmc-gold group-focus-visible:ring-offset-2 ${
                      done || here ? "bg-[#8EDCD7]" : "bg-[#ECEEF1]"
                    }`}
                  />
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-1.5">
          <h1 className="text-[26px] font-semibold leading-8 tracking-[-0.02em]">{title}</h1>
          {intro ? <p className="text-[15px] text-mmc-muted">{intro}</p> : null}
        </div>

        {children}

        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          {onBack ? (
            <button type="button" onClick={onBack} disabled={isSubmitting} className="tl-btn">
              Back
            </button>
          ) : null}
          <span className="flex-grow" />
          {onSaveExit ? (
            <button type="button" onClick={onSaveExit} disabled={isSubmitting} className="tl-btn">
              Save and exit
            </button>
          ) : null}
          <button type="button" onClick={onNext} disabled={isSubmitting} className="tl-btn tl-btn-primary">
            {isSubmitting ? (
              <>
                <span aria-hidden="true" className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Submitting
              </>
            ) : (
              <>
                <svg aria-hidden="true" width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
                  <path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z" />
                </svg>
                {nextLabel}
              </>
            )}
          </button>
        </div>
      </main>

      <div className="w-full flex-grow" />
      <div className="-mx-4 w-[calc(100%+2rem)]">
        <TalariaBands />
      </div>
    </div>
  );
}
