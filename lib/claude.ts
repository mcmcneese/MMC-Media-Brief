// Claude wrapper for extracting structured brief data from meeting notes.
//
// Design:
//   - Latest stable Sonnet (`claude-sonnet-4-6`) for cost/quality balance.
//   - System prompt is stable across calls — cached via prompt caching so
//     each follow-up call only pays for the (varying) transcript.
//   - Structured output is enforced via `output_config.format` (JSON schema)
//     so the model returns a JSON object that conforms to FormData's shape.
//   - Unknown fields come back as `null`; we merge non-null values into the
//     existing FormData (never wipe data the admin already entered).

import Anthropic from "@anthropic-ai/sdk";
import type { FormData, MultiSelectValue } from "./types";
import { EMPTY_FORM_DATA } from "./types";

// ---- Configuration ----

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";
const MAX_TOKENS = 4096;

export function isClaudeConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export class ClaudeConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClaudeConfigError";
  }
}

function getClient(): Anthropic {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new ClaudeConfigError(
      "Claude is not configured. Set ANTHROPIC_API_KEY in your environment."
    );
  }
  return new Anthropic({ apiKey: key });
}

// ---- JSON Schema for structured output ----
//
// All fields are in `required` (Anthropic structured outputs constraint),
// but each field's type allows null — Claude returns null when it can't
// confidently extract a value.

const REGULATION_OPTIONS = [
  "Health/medical claims",
  "Financial services",
  "Alcohol",
  "Cannabis/CBD",
  "Supplements",
  "Political",
  "Gambling",
  "Children's products",
  "None",
  "Other",
];

const CREATIVE_OPTIONS = [
  "Linear Video",
  "CTV Video",
  "Digital Display",
  "Custom Content",
  "Social",
  "OOH",
  "Other",
];

const multiSelectSchema = (allowedValues: string[]) => ({
  anyOf: [
    {
      type: "object",
      additionalProperties: false,
      required: ["selected", "other"],
      properties: {
        selected: {
          type: "array",
          items: { type: "string", enum: allowedValues },
        },
        other: { type: "string" },
      },
    },
    { type: "null" },
  ],
});

const nullableString = { type: ["string", "null"] };
const nullableNumber = { type: ["number", "null"] };
const nullableEnum = (values: string[]) => ({
  anyOf: [{ type: "string", enum: values }, { type: "null" }],
});

const BRIEF_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "contactName",
    "contactEmail",
    "companyName",
    "companyWebsite",
    "companyDescription",
    "usp",
    "differentiators",
    "competitor1",
    "competitor2",
    "competitor3",
    "pricing",
    "availability",
    "regulations",
    "ltv",
    "targetConsumer",
    "businessType",
    "geographicFocus",
    "interestsAndHabits",
    "additionalPersonas",
    "hasAdvertised",
    "pastVendors",
    "whatWorked",
    "whatDidntWork",
    "pastGeo",
    "pastCreative",
    "pastGoal",
    "primaryGoal",
    "kpis",
    "successDefinition",
    "trackingTech",
    "seasonality",
    "channelPreferences",
    "startDate",
    "endDate",
    "budget",
    "hasTVCommercial",
    "hasDisplayAds",
  ],
  properties: {
    contactName: nullableString,
    contactEmail: nullableString,
    companyName: nullableString,
    companyWebsite: nullableString,
    companyDescription: nullableString,
    usp: nullableString,
    differentiators: nullableString,
    competitor1: nullableString,
    competitor2: nullableString,
    competitor3: nullableString,
    pricing: nullableString,
    availability: nullableString,
    regulations: multiSelectSchema(REGULATION_OPTIONS),
    ltv: nullableNumber,
    targetConsumer: nullableString,
    businessType: nullableEnum(["B2B", "B2C", "Mix of both"]),
    geographicFocus: nullableString,
    interestsAndHabits: nullableString,
    additionalPersonas: nullableString,
    hasAdvertised: nullableEnum(["Yes", "No"]),
    pastVendors: nullableString,
    whatWorked: nullableString,
    whatDidntWork: nullableString,
    pastGeo: nullableString,
    pastCreative: multiSelectSchema(CREATIVE_OPTIONS),
    pastGoal: nullableString,
    primaryGoal: nullableEnum([
      "Brand Awareness",
      "Product Consideration",
      "Acquisition",
    ]),
    kpis: nullableString,
    successDefinition: nullableString,
    trackingTech: nullableString,
    seasonality: nullableString,
    channelPreferences: nullableString,
    startDate: nullableString, // ISO YYYY-MM-DD
    endDate: nullableString,
    budget: nullableNumber,
    hasTVCommercial: nullableEnum(["Yes", "No"]),
    hasDisplayAds: nullableEnum(["Yes", "No"]),
  },
};

// ---- System prompt (cached prefix) ----

const SYSTEM_PROMPT = `You extract structured brief data from meeting notes between Mercurius Media Capital (MMC) — a media-for-equity investment firm — and prospective portfolio companies.

Your job: read the supplied meeting transcript and/or summary and return a JSON object that fills in the prospect's media brief.

CRITICAL RULES
1. Only fill a field when the transcript provides clear, direct evidence for the answer. Paraphrase what was said; do not invent.
2. When a field is not discussed, you are unsure, or you would need to guess, return null for that field.
3. Use the exact enum values listed in the schema for constrained fields (e.g. "B2B", "B2C", "Mix of both"; "Yes" / "No"; "Brand Awareness" / "Product Consideration" / "Acquisition").
4. For currency fields (ltv, budget), return a plain number in USD (e.g. 1500000 for $1.5M). Do not include currency symbols or commas. If the transcript mentions a range, return the midpoint. If unsure, return null.
5. For date fields (startDate, endDate), return ISO format YYYY-MM-DD. If the transcript only mentions a month or quarter, pick the first day of that period. If unsure, return null.
6. For multi-select fields (regulations, pastCreative), return an object { selected: string[], other: string }. Use only the schema's allowed values for "selected". Put any concept that doesn't fit the allowed list into "other". If unsure, return null for the whole object — do NOT return an empty selected array.
7. Be conservative. It is much better to leave fields null and let the prospect fill them in than to put incorrect values that the prospect has to correct.

FIELD GUIDE (what each field captures)

Contact:
- contactName: The primary contact person at the prospect company.
- contactEmail: Their email address.

Company:
- companyName: The prospect's company name.
- companyWebsite: Their website URL (https://... if explicitly mentioned).
- companyDescription: A 2-3 sentence description of what the company does, in MMC's voice. Aim for ~100 words max.
- usp: Their unique selling proposition — what specifically makes them stand out. ~50 words.
- differentiators: What makes them different from competitors. ~150 words.
- competitor1, competitor2, competitor3: Three named competitors mentioned in the transcript.
- pricing: How their product/service is priced. Include range if known.
- availability: Where it can be purchased (National, online only, retail, etc.).
- regulations: Advertising regulation categories that apply (Health, Financial services, Alcohol, etc.).
- ltv: Customer lifetime value or goal LTV, in USD.

Audience:
- targetConsumer: Age range, gender, household income, basic demographics.
- businessType: B2B, B2C, or Mix of both.
- geographicFocus: National, regional, specific markets.
- interestsAndHabits: Where the target consumer spends time, what they care about.
- additionalPersonas: Other audiences MMC should be aware of.

Paid Media History:
- hasAdvertised: Whether the company has run paid media before. Yes or No.
- pastVendors: If yes — which vendors, channels, and what they spent. Free text.
- whatWorked: What channels/tactics performed well.
- whatDidntWork: What underperformed.
- pastGeo: Where past media ran.
- pastCreative: Which creative formats they've already produced.
- pastGoal: What KPIs past media optimized against.

Campaign:
- primaryGoal: Brand Awareness, Product Consideration, or Acquisition.
- kpis: KPIs the prospect wants this campaign to move.
- successDefinition: What they would consider a successful campaign beyond pure metrics.
- trackingTech: GA, HubSpot, Mixpanel, etc.
- seasonality: Time-of-year or time-of-day factors.
- channelPreferences: Channels they're interested in or want to avoid.
- startDate / endDate: Campaign window, ISO YYYY-MM-DD.
- budget: Ideal campaign budget in USD.
- hasTVCommercial: Whether they have a TV commercial ready (Yes / No).
- hasDisplayAds: Whether they have standard digital display ads ready (Yes / No).

Return only the JSON object. No prose, no explanation.`;

// ---- Public API ----

export interface ExtractResult {
  /** Partial FormData — fields the model confidently extracted. */
  extracted: Partial<FormData>;
  /** Tokens consumed (helps with cost monitoring). */
  usage: {
    inputTokens: number;
    outputTokens: number;
    cacheReadInputTokens?: number;
    cacheCreationInputTokens?: number;
  };
}

/**
 * Extract a partial FormData object from the supplied meeting notes.
 * Returned fields are best-effort — fields the model couldn't determine
 * come back as null and are stripped from the result before being merged.
 */
export async function extractFormData(noteText: string): Promise<ExtractResult> {
  const client = getClient();

  const userContent = `Meeting notes / transcript:\n\n${noteText.trim()}\n\nExtract the structured brief data.`;

  // The SDK 0.96 types may not yet surface `output_config` — cast through unknown.
  const params = {
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userContent }],
    output_config: {
      format: {
        type: "json_schema",
        schema: BRIEF_SCHEMA,
      },
    },
  } as unknown as Anthropic.MessageCreateParamsNonStreaming;

  const response = await client.messages.create(params);

  // First text block holds the JSON per the structured-output contract.
  const textBlock = response.content.find(
    (b): b is Anthropic.TextBlock => b.type === "text"
  );
  if (!textBlock) {
    throw new Error("Claude returned no text content");
  }

  let raw: unknown;
  try {
    raw = JSON.parse(textBlock.text);
  } catch (err) {
    throw new Error(
      `Failed to parse Claude JSON output: ${
        err instanceof Error ? err.message : String(err)
      }. Raw: ${textBlock.text.slice(0, 500)}`
    );
  }

  const extracted = stripNulls(raw);

  // Pull cache usage if exposed by the SDK type — typed defensively.
  const usage = response.usage as Anthropic.Usage & {
    cache_read_input_tokens?: number;
    cache_creation_input_tokens?: number;
  };

  return {
    extracted,
    usage: {
      inputTokens: usage.input_tokens ?? 0,
      outputTokens: usage.output_tokens ?? 0,
      cacheReadInputTokens: usage.cache_read_input_tokens,
      cacheCreationInputTokens: usage.cache_creation_input_tokens,
    },
  };
}

// Drop null fields (model couldn't determine them) so the caller's merge
// step only overrides existing data when the model had evidence.
function stripNulls(raw: unknown): Partial<FormData> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (value === null || value === undefined) continue;
    // Multi-selects: drop if selected[] is empty AND other is empty
    if (key === "regulations" || key === "pastCreative") {
      const ms = value as { selected?: unknown; other?: unknown };
      const selected = Array.isArray(ms?.selected) ? ms.selected : [];
      const other = typeof ms?.other === "string" ? ms.other : "";
      if (selected.length === 0 && other.trim() === "") continue;
      out[key] = { selected, other } as MultiSelectValue;
      continue;
    }
    out[key] = value;
  }
  return out as Partial<FormData>;
}

/**
 * Merge an extracted partial into an existing FormData, only overriding
 * fields the model actually filled in. Existing admin-entered data wins
 * over null/empty extraction.
 */
export function mergeExtraction(
  base: FormData,
  extracted: Partial<FormData>
): FormData {
  const merged: FormData = { ...EMPTY_FORM_DATA, ...base };
  for (const [key, value] of Object.entries(extracted)) {
    if (value === null || value === undefined) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    (merged as unknown as Record<string, unknown>)[key] = value;
  }
  return merged;
}
