import { z } from "zod";

// Re-used pieces
const nonEmpty = (label: string) =>
  z.string().trim().min(1, { message: `${label} is required` });

const urlField = z
  .string()
  .trim()
  .min(1, { message: "Company website is required" })
  .refine(
    (val) => {
      // Accept with or without protocol; add https:// if missing before validating
      const withProto = /^https?:\/\//i.test(val) ? val : `https://${val}`;
      try {
        new URL(withProto);
        return /\./.test(val); // require a dot — bare strings like "foo" are not URLs
      } catch {
        return false;
      }
    },
    { message: "Please enter a valid website URL (e.g., https://example.com)" }
  );

const emailField = z
  .string()
  .trim()
  .min(1, { message: "Email is required" })
  .email({ message: "Please enter a valid email address" });

// Multi-select: at least one option OR Other with text
const multiSelectSchema = (label: string) =>
  z
    .object({
      selected: z.array(z.string()),
      other: z.string(),
    })
    .refine(
      (val) => {
        if (val.selected.length === 0) return false;
        // If "Other" is selected, require the text
        if (val.selected.includes("Other") && val.other.trim().length === 0) {
          return false;
        }
        return true;
      },
      { message: `${label} — please select at least one option (and fill in "Other" if selected)` }
    );

// Base schema (every field required — Section 3 sub-questions also required here)
export const fullSchema = z
  .object({
    // Contact
    contactName: nonEmpty("Contact name"),
    contactEmail: emailField,

    // Section 1
    companyName: nonEmpty("Company name"),
    companyWebsite: urlField,
    companyDescription: nonEmpty("Company description"),
    usp: nonEmpty("USP"),
    differentiators: nonEmpty("Market differentiators"),
    competitor1: nonEmpty("Competitor 1"),
    competitor2: nonEmpty("Competitor 2"),
    competitor3: nonEmpty("Competitor 3"),
    pricing: nonEmpty("Pricing"),
    availability: nonEmpty("Availability"),
    regulations: multiSelectSchema("Advertising regulations"),
    ltv: z
      .number({ invalid_type_error: "Please enter a numeric LTV" })
      .nonnegative({ message: "LTV must be zero or a positive number" }),

    // Section 2
    targetConsumer: nonEmpty("Target consumer"),
    businessType: z.enum(["B2B", "B2C", "Mix of both"], {
      errorMap: () => ({ message: "Please select a business type" }),
    }),
    geographicFocus: nonEmpty("Geographic focus"),
    interestsAndHabits: nonEmpty("Interests and purchase habits"),
    additionalPersonas: nonEmpty("Additional personas"),

    // Section 3
    hasAdvertised: z.enum(["Yes", "No"], {
      errorMap: () => ({ message: "Please select Yes or No" }),
    }),
    pastVendors: z.string(),
    whatWorked: z.string(),
    whatDidntWork: z.string(),
    pastGeo: z.string(),
    pastCreative: z
      .object({
        selected: z.array(z.string()),
        other: z.string(),
      })
      .default({ selected: [], other: "" }),
    pastGoal: z.string(),

    // Section 4
    primaryGoal: z.enum(["Brand Awareness", "Product Consideration", "Acquisition"], {
      errorMap: () => ({ message: "Please select a primary goal" }),
    }),
    kpis: nonEmpty("KPIs"),
    successDefinition: nonEmpty("Definition of success"),
    trackingTech: nonEmpty("Tracking technology"),
    seasonality: nonEmpty("Seasonality"),
    channelPreferences: nonEmpty("Channel preferences"),
    startDate: nonEmpty("Start date"),
    endDate: nonEmpty("End date"),
    budget: z
      .number({ invalid_type_error: "Please enter a numeric budget" })
      .nonnegative({ message: "Budget must be zero or a positive number" }),
    hasTVCommercial: z.enum(["Yes", "No"], {
      errorMap: () => ({ message: "Please select Yes or No" }),
    }),
    hasDisplayAds: z.enum(["Yes", "No"], {
      errorMap: () => ({ message: "Please select Yes or No" }),
    }),
  })
  // end date must be after start date
  .superRefine((data, ctx) => {
    if (data.startDate && data.endDate) {
      const s = new Date(data.startDate).getTime();
      const e = new Date(data.endDate).getTime();
      if (!Number.isNaN(s) && !Number.isNaN(e) && e < s) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endDate"],
          message: "End date must be on or after start date",
        });
      }
    }
    // If hasAdvertised === "Yes", all sub-questions required
    if (data.hasAdvertised === "Yes") {
      const requiredWhenYes: Array<[keyof typeof data, string]> = [
        ["pastVendors", "Past vendors"],
        ["whatWorked", "What worked"],
        ["whatDidntWork", "What didn't work"],
        ["pastGeo", "Past geography"],
        ["pastGoal", "Past media goal"],
      ];
      for (const [key, label] of requiredWhenYes) {
        const v = data[key];
        if (typeof v !== "string" || v.trim().length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [key as string],
            message: `${label} is required`,
          });
        }
      }
      // pastCreative requires at least one checkbox (or Other with text)
      const pc = data.pastCreative;
      const pcOk =
        pc.selected.length > 0 &&
        (!pc.selected.includes("Other") || pc.other.trim().length > 0);
      if (!pcOk) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["pastCreative"],
          message: "Please select at least one creative format (and fill in \"Other\" if selected)",
        });
      }
    }
  });

// Per-step field lists for partial validation when user clicks "Continue".
export const STEP_FIELDS: string[][] = [
  ["contactName", "contactEmail"],
  [
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
  ],
  [
    "targetConsumer",
    "businessType",
    "geographicFocus",
    "interestsAndHabits",
    "additionalPersonas",
  ],
  // Section 3 — validation handles the conditional logic
  [
    "hasAdvertised",
    "pastVendors",
    "whatWorked",
    "whatDidntWork",
    "pastGeo",
    "pastCreative",
    "pastGoal",
  ],
  [
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
  [], // Review — no new fields
];

export type FullSchema = z.infer<typeof fullSchema>;
