"use client";

import { forwardRef, useId } from "react";

interface CurrencyInputProps {
  label: string;
  helpText?: string;
  error?: string;
  required?: boolean;
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  shake?: boolean;
  id?: string;
}

function formatCurrency(n: number | null): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "";
  return "$" + Math.round(n).toLocaleString("en-US");
}

function parseDigits(s: string): number | null {
  const digits = s.replace(/[^\d]/g, "");
  if (digits.length === 0) return null;
  const n = Number.parseInt(digits, 10);
  return Number.isFinite(n) ? n : null;
}

const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(function CurrencyInput(
  { label, helpText, error, required, value, onChange, placeholder, shake, id },
  ref
) {
  const reactId = useId();
  const inputId = id ?? `cur-${reactId}`;
  const helpId = helpText ? `${inputId}-help` : undefined;
  const errId = error ? `${inputId}-err` : undefined;

  const borderColor = error
    ? "border-mmc-error focus:border-mmc-error"
    : "border-mmc-border focus:border-mmc-dark";

  const displayValue = formatCurrency(value);

  return (
    <div className={`flex flex-col gap-1 ${shake ? "mmc-shake" : ""}`}>
      <label htmlFor={inputId} className="text-sm font-medium text-mmc-text">
        {label}
        {required ? <span aria-hidden="true" className="text-mmc-error"> *</span> : null}
      </label>
      <input
        id={inputId}
        ref={ref}
        type="text"
        inputMode="numeric"
        value={displayValue}
        placeholder={placeholder ?? "$0"}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={[helpId, errId].filter(Boolean).join(" ") || undefined}
        onChange={(e) => onChange(parseDigits(e.target.value))}
        onBlur={(e) => onChange(parseDigits(e.target.value))}
        className={`w-full rounded-md border ${borderColor} bg-white px-4 py-3 text-mmc-text outline-none transition focus:ring-2 focus:ring-mmc-accent focus:ring-offset-2 focus:ring-offset-mmc-bg`}
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

export default CurrencyInput;
