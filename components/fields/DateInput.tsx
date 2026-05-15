"use client";

import { forwardRef, InputHTMLAttributes, useId } from "react";

interface DateInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  helpText?: string;
  error?: string;
  required?: boolean;
  shake?: boolean;
  /** When true, shows a gold "Needs your input" hint next to the label. */
  needsInput?: boolean;
}

const DateInput = forwardRef<HTMLInputElement, DateInputProps>(function DateInput(
  { label, helpText, error, required, shake, needsInput, className = "", id, ...rest },
  ref
) {
  const reactId = useId();
  const inputId = id ?? `d-${reactId}`;
  const helpId = helpText ? `${inputId}-help` : undefined;
  const errId = error ? `${inputId}-err` : undefined;

  const borderColor = error
    ? "border-mmc-error focus:border-mmc-error"
    : "border-mmc-border focus:border-mmc-dark";

  return (
    <div className={`flex flex-col gap-1 ${shake ? "mmc-shake" : ""}`}>
      <label htmlFor={inputId} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-mmc-text">
        <span>
          {label}
          {required ? <span aria-hidden="true" className="text-mmc-error"> *</span> : null}
        </span>
        {needsInput ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-mmc-gold/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-mmc-gold">
            <span className="h-1.5 w-1.5 rounded-full bg-mmc-gold" aria-hidden="true" />
            Needs your input
          </span>
        ) : null}
      </label>
      <input
        id={inputId}
        ref={ref}
        type="date"
        aria-invalid={error ? "true" : "false"}
        aria-describedby={[helpId, errId].filter(Boolean).join(" ") || undefined}
        className={`w-full rounded-md border ${borderColor} bg-white px-4 py-3 text-mmc-text outline-none transition focus:ring-2 focus:ring-mmc-accent focus:ring-offset-2 focus:ring-offset-mmc-bg ${className}`}
        {...rest}
      />
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

export default DateInput;
