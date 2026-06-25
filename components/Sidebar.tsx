"use client";

import { Check } from "lucide-react";
import type { StepIndex } from "@/lib/types";

interface SidebarProps {
  currentStep: StepIndex;
  onJump: (step: StepIndex) => void;
  /** Content step indices (0–4) that still have required fields missing. */
  incompleteSteps: number[];
}

// Short labels for the sidebar; full titles appear on each step page.
const STEP_LABELS = [
  "Contact",
  "Company",
  "Audience",
  "Past Media",
  "Campaign",
  "Review",
] as const;

export default function Sidebar({ currentStep, onJump, incompleteSteps }: SidebarProps) {
  return (
    <nav aria-label="Brief progress" className="sticky top-24">
      <p className="mmc-kicker mb-4 px-1">Your Brief</p>
      <ol className="flex flex-col">
        {STEP_LABELS.map((label, idx) => {
          const i = idx as StepIndex;
          const num = String(idx + 1).padStart(2, "0");
          const isCurrent = i === currentStep;
          // A content section (0–4) is complete when none of its required
          // fields are missing. The Review step (5) never shows a marker.
          const isComplete = idx <= 4 && !incompleteSteps.includes(idx);
          const isLast = idx === STEP_LABELS.length - 1;

          // Number color/state
          const numClass = isCurrent
            ? "text-mmc-gold"
            : isComplete
            ? "text-mmc-gold/80"
            : "text-mmc-muted";

          // Label color/state
          const labelClass = isCurrent
            ? "text-mmc-purple font-semibold"
            : "text-mmc-text";

          return (
            <li key={label} className={isLast ? "" : "border-b border-mmc-border/60"}>
              <button
                type="button"
                onClick={() => onJump(i)}
                aria-current={isCurrent ? "step" : undefined}
                className="group flex w-full items-center gap-4 py-3.5 px-2 -mx-2 rounded-sm text-left transition cursor-pointer hover:bg-mmc-creamDeep/40"
              >
                <span
                  aria-hidden="true"
                  className={`flex-none font-bold tabular-nums ${numClass} ${
                    isCurrent ? "text-2xl" : "text-xl"
                  }`}
                >
                  {num}
                </span>
                <span className={`flex-1 text-sm leading-tight ${labelClass}`}>
                  {label}
                </span>
                {isComplete ? (
                  <Check
                    size={16}
                    strokeWidth={2.5}
                    className="flex-none text-mmc-gold"
                    aria-label="completed"
                  />
                ) : null}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
