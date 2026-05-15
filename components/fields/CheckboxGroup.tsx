"use client";

import { useId } from "react";
import type { MultiSelectValue } from "@/lib/types";

interface CheckboxGroupProps {
  label: string;
  helpText?: string;
  error?: string;
  required?: boolean;
  options: string[];
  includeOther?: boolean;
  value: MultiSelectValue;
  onChange: (v: MultiSelectValue) => void;
  shake?: boolean;
  /** When true, shows a gold "Needs your input" hint next to the legend. */
  needsInput?: boolean;
}

export default function CheckboxGroup({
  label,
  helpText,
  error,
  required,
  options,
  includeOther = true,
  value,
  onChange,
  shake,
  needsInput,
}: CheckboxGroupProps) {
  const reactId = useId();
  const groupId = `cg-${reactId}`;
  const helpId = helpText ? `${groupId}-help` : undefined;
  const errId = error ? `${groupId}-err` : undefined;

  const toggle = (opt: string) => {
    const isSelected = value.selected.includes(opt);
    const next = isSelected
      ? value.selected.filter((x) => x !== opt)
      : [...value.selected, opt];
    onChange({ ...value, selected: next, other: isSelected && opt === "Other" ? "" : value.other });
  };

  const onOtherText = (text: string) => {
    onChange({ ...value, other: text });
  };

  const allOpts = includeOther ? [...options, "Other"] : options;
  const otherChecked = value.selected.includes("Other");

  return (
    <fieldset
      className={`flex flex-col gap-2 ${shake ? "mmc-shake" : ""}`}
      aria-describedby={[helpId, errId].filter(Boolean).join(" ") || undefined}
      aria-invalid={error ? "true" : "false"}
    >
      <legend className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-mmc-text">
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
      </legend>
      <div className="flex flex-col gap-2">
        {allOpts.map((opt) => {
          const checked = value.selected.includes(opt);
          const optId = `${groupId}-${opt.replace(/\s+/g, "-")}`;
          const isOther = opt === "Other";
          return (
            <div key={opt}>
              <label
                htmlFor={optId}
                className={`flex cursor-pointer items-center gap-3 rounded-md border px-4 py-3 transition ${
                  checked ? "border-mmc-accent bg-white" : "border-mmc-border bg-white hover:border-mmc-dark/40"
                }`}
              >
                <input
                  id={optId}
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(opt)}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className={`inline-flex h-4 w-4 flex-none items-center justify-center rounded border-2 ${
                    checked ? "border-mmc-accent bg-mmc-accent" : "border-mmc-border bg-white"
                  }`}
                >
                  {checked ? (
                    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                      <path
                        d="M1.5 5.5l2 2 5-5"
                        fill="none"
                        stroke="#FFFFFF"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : null}
                </span>
                <span className="text-sm text-mmc-text">{isOther ? "Other" : opt}</span>
              </label>
              {isOther && otherChecked ? (
                <input
                  type="text"
                  value={value.other}
                  onChange={(e) => onOtherText(e.target.value)}
                  placeholder="Please specify"
                  aria-label="Other — please specify"
                  className="mt-2 w-full rounded-md border border-mmc-border bg-white px-4 py-3 text-mmc-text outline-none transition focus:border-mmc-dark focus:ring-2 focus:ring-mmc-accent focus:ring-offset-2 focus:ring-offset-mmc-bg"
                />
              ) : null}
            </div>
          );
        })}
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
    </fieldset>
  );
}
