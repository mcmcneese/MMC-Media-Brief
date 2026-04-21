// localStorage save/resume helpers.
// Versioned key so future schema changes can invalidate old drafts gracefully.

import type { FormData, StepIndex } from "./types";

const DRAFT_KEY = "mmc_brief_draft_v1";
const STEP_KEY = "mmc_brief_step_v1";

interface DraftPayload {
  version: 1;
  data: FormData;
  updatedAt: string;
}

export function saveDraft(data: FormData): void {
  if (typeof window === "undefined") return;
  try {
    const payload: DraftPayload = {
      version: 1,
      data,
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
  } catch {
    // localStorage may be disabled (private browsing). Fail silently.
  }
}

export function loadDraft(): FormData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DraftPayload;
    if (parsed.version !== 1 || !parsed.data) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export function saveStep(step: StepIndex): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STEP_KEY, String(step));
  } catch {
    /* noop */
  }
}

export function loadStep(): StepIndex {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(STEP_KEY);
    if (!raw) return 0;
    const n = Number.parseInt(raw, 10);
    if (Number.isFinite(n) && n >= 0 && n <= 5) return n as StepIndex;
  } catch {
    /* noop */
  }
  return 0;
}

export function clearDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DRAFT_KEY);
    window.localStorage.removeItem(STEP_KEY);
  } catch {
    /* noop */
  }
}

// Session-storage unlock flag for password gate.
const UNLOCK_KEY = "mmc_brief_unlocked";

export function setUnlocked(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(UNLOCK_KEY, "true");
  } catch {
    /* noop */
  }
}

export function isUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(UNLOCK_KEY) === "true";
  } catch {
    return false;
  }
}
