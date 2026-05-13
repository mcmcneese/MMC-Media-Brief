// Shared types used across the app.

export type BusinessType = "B2B" | "B2C" | "Mix of both";
export type PrimaryGoal = "Brand Awareness" | "Product Consideration" | "Acquisition";
export type YesNo = "Yes" | "No";

// A "multi-select with Other" value.
// `selected` holds the checked options (e.g. ["Alcohol", "Supplements"]).
// `other` holds the text filled into the "Other:" input (empty string if Other not selected).
export interface MultiSelectValue {
  selected: string[];
  other: string;
}

export interface FormData {
  // Contact (pre-section)
  contactName: string;
  contactEmail: string;

  // Section 1 — Company Information
  companyName: string;
  companyWebsite: string;
  companyDescription: string;
  usp: string;
  differentiators: string;
  competitor1: string;
  competitor2: string;
  competitor3: string;
  pricing: string;
  availability: string;
  regulations: MultiSelectValue;
  ltv: number | null;

  // Section 2 — Audience Details
  targetConsumer: string;
  businessType: BusinessType | "";
  geographicFocus: string;
  interestsAndHabits: string;
  additionalPersonas: string;

  // Section 3 — Past and Present Paid Media
  hasAdvertised: YesNo | "";
  pastVendors: string;
  whatWorked: string;
  whatDidntWork: string;
  pastGeo: string;
  pastCreative: MultiSelectValue;
  pastGoal: string;

  // Section 4 — MMC Campaign Set Up
  primaryGoal: PrimaryGoal | "";
  kpis: string;
  successDefinition: string;
  trackingTech: string;
  seasonality: string;
  channelPreferences: string;
  startDate: string; // ISO YYYY-MM-DD
  endDate: string;
  budget: number | null;
  hasTVCommercial: YesNo | "";
  hasDisplayAds: YesNo | "";
}

export const EMPTY_FORM_DATA: FormData = {
  contactName: "",
  contactEmail: "",
  companyName: "",
  companyWebsite: "",
  companyDescription: "",
  usp: "",
  differentiators: "",
  competitor1: "",
  competitor2: "",
  competitor3: "",
  pricing: "",
  availability: "",
  regulations: { selected: [], other: "" },
  ltv: null,
  targetConsumer: "",
  businessType: "",
  geographicFocus: "",
  interestsAndHabits: "",
  additionalPersonas: "",
  hasAdvertised: "",
  pastVendors: "",
  whatWorked: "",
  whatDidntWork: "",
  pastGeo: "",
  pastCreative: { selected: [], other: "" },
  pastGoal: "",
  primaryGoal: "",
  kpis: "",
  successDefinition: "",
  trackingTech: "",
  seasonality: "",
  channelPreferences: "",
  startDate: "",
  endDate: "",
  budget: null,
  hasTVCommercial: "",
  hasDisplayAds: "",
};

// Step index <-> name mapping.
// `kicker`: small uppercase gold label above the section title (deck-style).
// `title`:  big purple H1 displayed above the form card.
export const STEPS = [
  {
    index: 0,
    name: "Contact",
    kicker: "Getting Started",
    title: "Contact",
  },
  {
    index: 1,
    name: "Section 1",
    kicker: "Section 1 of 4 · Company",
    title: "Company Information",
  },
  {
    index: 2,
    name: "Section 2",
    kicker: "Section 2 of 4 · Audience",
    title: "Audience Details",
  },
  {
    index: 3,
    name: "Section 3",
    kicker: "Section 3 of 4 · Paid Media",
    title: "Past and Present Paid Media",
  },
  {
    index: 4,
    name: "Section 4",
    kicker: "Section 4 of 4 · Campaign",
    title: "Campaign Set Up",
  },
  {
    index: 5,
    name: "Review",
    kicker: "Final Step",
    title: "Review & Submit",
  },
] as const;

export type StepIndex = 0 | 1 | 2 | 3 | 4 | 5;
