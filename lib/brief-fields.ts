// ============================================================
// One description of every brief answer: its label, its section, and how to
// keep a value in the shape the form uses. Shared by saved progress and the
// Talaria connector.
// ============================================================

import { EMPTY_FORM_DATA, type FormData } from "./types";

export const SECTIONS = ["Contact", "Company", "Audience", "Past paid media", "Campaign set up"] as const;

type Kind = "text" | "money" | "multi";

export interface FieldDef {
  key: keyof FormData;
  label: string;
  section: (typeof SECTIONS)[number];
  kind: Kind;
}

const f = (key: keyof FormData, label: string, section: FieldDef["section"], kind: Kind = "text"): FieldDef => ({ key, label, section, kind });

export const FIELDS: FieldDef[] = [
  f("contactName", "Primary contact name", "Contact"),
  f("contactEmail", "Primary contact email", "Contact"),
  f("companyName", "Company name", "Company"),
  f("companyWebsite", "Company website", "Company"),
  f("companyDescription", "Company description", "Company"),
  f("usp", "USP", "Company"),
  f("differentiators", "Market differentiators", "Company"),
  f("competitor1", "Top competitor 1", "Company"),
  f("competitor2", "Top competitor 2", "Company"),
  f("competitor3", "Top competitor 3", "Company"),
  f("pricing", "Pricing", "Company"),
  f("availability", "Availability", "Company"),
  f("regulations", "Advertising regulations", "Company", "multi"),
  f("ltv", "Current LTV (or goal LTV)", "Company", "money"),
  f("targetConsumer", "Target consumer", "Audience"),
  f("businessType", "Business type", "Audience"),
  f("geographicFocus", "Geographic focus", "Audience"),
  f("interestsAndHabits", "Interests and purchase habits", "Audience"),
  f("additionalPersonas", "Additional personas", "Audience"),
  f("hasAdvertised", "Advertised in the past", "Past paid media"),
  f("pastVendors", "Past vendors and spend", "Past paid media"),
  f("whatWorked", "What worked well", "Past paid media"),
  f("whatDidntWork", "What didn't work", "Past paid media"),
  f("pastGeo", "Geography", "Past paid media"),
  f("pastCreative", "Creative formats used", "Past paid media", "multi"),
  f("pastGoal", "Goal of past media", "Past paid media"),
  f("primaryGoal", "Primary campaign goal", "Campaign set up"),
  f("kpis", "KPIs", "Campaign set up"),
  f("successDefinition", "Definition of success", "Campaign set up"),
  f("trackingTech", "Tracking technology", "Campaign set up"),
  f("seasonality", "Seasonality", "Campaign set up"),
  f("channelPreferences", "Channel preferences", "Campaign set up"),
  f("startDate", "Start date", "Campaign set up"),
  f("endDate", "End date", "Campaign set up"),
  f("budget", "Ideal budget", "Campaign set up", "money"),
  f("hasTVCommercial", "TV commercial available", "Campaign set up"),
  f("hasDisplayAds", "Display ads available", "Campaign set up"),
];

const MAX_TEXT = 20_000;

/** Keep only known answers, each in the shape the form itself uses. */
export function cleanAnswers(raw: unknown): Partial<FormData> {
  const out: Record<string, unknown> = {};
  if (!raw || typeof raw !== "object") return out as Partial<FormData>;
  const input = raw as Record<string, unknown>;
  for (const def of FIELDS) {
    if (!(def.key in input)) continue;
    const value = input[def.key];
    if (def.kind === "money") {
      if (value === null || value === "") out[def.key] = null;
      else if (typeof value === "number" && Number.isFinite(value) && value >= 0) out[def.key] = value;
      else if (typeof value === "string" && /^[\d,.\s$]+$/.test(value)) {
        const n = Number(value.replace(/[,$\s]/g, ""));
        if (Number.isFinite(n)) out[def.key] = n;
      }
    } else if (def.kind === "multi") {
      if (value && typeof value === "object") {
        const v = value as { selected?: unknown; other?: unknown };
        out[def.key] = {
          selected: Array.isArray(v.selected) ? v.selected.filter((s) => typeof s === "string").slice(0, 50).map((s) => (s as string).slice(0, 200)) : [],
          other: typeof v.other === "string" ? v.other.slice(0, 2000) : "",
        };
      }
    } else if (typeof value === "string") {
      out[def.key] = value.slice(0, MAX_TEXT);
    }
  }
  return out as Partial<FormData>;
}

export function isAnswered(def: FieldDef, data: Partial<FormData>): boolean {
  const v = data[def.key] as unknown;
  if (def.kind === "money") return typeof v === "number";
  if (def.kind === "multi") {
    const m = v as { selected?: unknown[]; other?: string } | undefined;
    return Boolean(m && ((Array.isArray(m.selected) && m.selected.length > 0) || (m.other ?? "").trim().length > 0));
  }
  return typeof v === "string" && v.trim().length > 0;
}

export function countAnswered(data: Partial<FormData>): number {
  return FIELDS.filter((def) => isAnswered(def, data)).length;
}

export const FIELD_COUNT = FIELDS.length;

// Every form field has a definition here; this fails the build if one is missed.
const missing = (Object.keys(EMPTY_FORM_DATA) as (keyof FormData)[]).filter((k) => !FIELDS.some((d) => d.key === k));
if (missing.length > 0) throw new Error(`lib/brief-fields.ts is missing: ${missing.join(", ")}`);
