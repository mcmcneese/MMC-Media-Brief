// Helpers for inspecting FormData field state.

import type { FormData, MultiSelectValue } from "./types";

/**
 * True when a FormData field has no meaningful value yet — used to flag
 * fields that still need the prospect's input on a pre-filled brief.
 */
export function isFieldEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (typeof value === "number") return !Number.isFinite(value);
  if (typeof value === "object" && value !== null && "selected" in value) {
    const ms = value as MultiSelectValue;
    return ms.selected.length === 0 && ms.other.trim().length === 0;
  }
  return false;
}

/** Per-field shorthand for an entire FormData snapshot. */
export function getEmptyFields(data: FormData): Set<keyof FormData> {
  const empty = new Set<keyof FormData>();
  (Object.keys(data) as Array<keyof FormData>).forEach((key) => {
    if (isFieldEmpty(data[key])) empty.add(key);
  });
  return empty;
}
