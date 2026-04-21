"use client";

interface ProgressBarProps {
  step: number; // 0..5
}

// Progress rules per spec:
// Contact (0) = 0%
// Section 1 complete (2) = 25%
// Section 2 complete (3) = 50%
// Section 3 complete (4) = 75%
// Section 4 complete (5 = review) = 100%
function percentFor(step: number): number {
  switch (step) {
    case 0:
      return 0;
    case 1:
      return 0;
    case 2:
      return 25;
    case 3:
      return 50;
    case 4:
      return 75;
    case 5:
      return 100;
    default:
      return 0;
  }
}

export default function ProgressBar({ step }: ProgressBarProps) {
  const pct = percentFor(step);
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Form progress"
      className="h-1.5 w-full bg-mmc-border"
    >
      <div
        className="h-full bg-mmc-accent transition-[width] duration-300 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
