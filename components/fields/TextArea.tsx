"use client";

import { forwardRef, TextareaHTMLAttributes, useId } from "react";

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  helpText?: string;
  error?: string;
  required?: boolean;
  wordLimit?: number;
  shake?: boolean;
  /** When true, shows a gold "Needs your input" hint next to the label. */
  needsInput?: boolean;
}

function countWords(s: string): number {
  if (!s) return 0;
  return s.trim().split(/\s+/).filter(Boolean).length;
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, helpText, error, required, wordLimit, shake, needsInput, className = "", id, value = "", rows = 4, ...rest },
  ref
) {
  const reactId = useId();
  const inputId = id ?? `ta-${reactId}`;
  const helpId = helpText ? `${inputId}-help` : undefined;
  const errId = error ? `${inputId}-err` : undefined;

  const current = countWords(String(value));
  const over = typeof wordLimit === "number" && current > wordLimit;

  const borderColor = error
    ? "border-mmc-error focus:border-mmc-error"
    : "border-mmc-border focus:border-mmc-dark";

  return (
    <div className={`flex flex-col gap-1.5 ${shake ? "mmc-shake" : ""}`}>
      <label htmlFor={inputId} className="tl-label flex w-full flex-wrap items-center gap-x-2 gap-y-1">
        <span>
          {label}
          {required ? <span aria-hidden="true" className="text-mmc-error"> *</span> : null}
        </span>
        {needsInput ? (
          <span className="tl-pill ml-auto">Needs your answer</span>
        ) : null}
      </label>
      <div className="relative">
        <textarea
          id={inputId}
          ref={ref}
          rows={rows}
          value={value}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={[helpId, errId].filter(Boolean).join(" ") || undefined}
          className={`w-full resize-y rounded-[10px] border ${borderColor} bg-white px-3.5 py-[11px] text-sm pr-4 pb-7 text-mmc-text outline-none transition focus:ring-2 focus:ring-mmc-gold focus:ring-offset-1 focus:ring-offset-white ${className}`}
          {...rest}
        />
        {typeof wordLimit === "number" ? (
          <span
            aria-live="polite"
            className={`pointer-events-none absolute bottom-2 right-3 text-xs ${
              over ? "text-mmc-error" : "text-mmc-muted"
            }`}
          >
            {current} / {wordLimit} words
          </span>
        ) : null}
      </div>
      {helpText ? (
        <p id={helpId} className="text-xs text-mmc-muted">
          {helpText}
        </p>
      ) : null}
      {error ? (
        <p id={errId} className="text-xs text-mmc-error">
          {error}
        </p>
      ) : null}
    </div>
  );
});

export default TextArea;
