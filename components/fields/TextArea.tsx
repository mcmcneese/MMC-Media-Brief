"use client";

import { forwardRef, TextareaHTMLAttributes, useId } from "react";

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  helpText?: string;
  error?: string;
  required?: boolean;
  wordLimit?: number;
  shake?: boolean;
}

function countWords(s: string): number {
  if (!s) return 0;
  return s.trim().split(/\s+/).filter(Boolean).length;
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, helpText, error, required, wordLimit, shake, className = "", id, value = "", rows = 4, ...rest },
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
    <div className={`flex flex-col gap-1 ${shake ? "mmc-shake" : ""}`}>
      <label htmlFor={inputId} className="text-sm font-medium text-mmc-text">
        {label}
        {required ? <span aria-hidden="true" className="text-mmc-error"> *</span> : null}
      </label>
      <div className="relative">
        <textarea
          id={inputId}
          ref={ref}
          rows={rows}
          value={value}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={[helpId, errId].filter(Boolean).join(" ") || undefined}
          className={`w-full resize-y rounded-md border ${borderColor} bg-white px-4 py-3 pr-4 pb-7 text-mmc-text outline-none transition focus:ring-2 focus:ring-mmc-accent focus:ring-offset-2 focus:ring-offset-mmc-bg ${className}`}
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
