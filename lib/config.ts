// ============================================================
// MMC BRIEF INTAKE — EDITABLE CONFIG
// Edit values below. Save. Commit. Push to GitHub. Vercel auto-deploys.
// ============================================================
//
// This is the single source of truth for editable content.
// If you want to change the password, branding, email copy,
// or who receives submission emails — edit it HERE.
//
// You do NOT need to touch any component files to change these.
// ============================================================

export const CONFIG = {
  // --- ACCESS ---
  // Shared password every prospect uses to open the form.
  // To change: edit the string below, commit, push. Done.
  PASSWORD: "ATTENTION",

  // --- BRANDING ---
  BRAND: {
    name: "Mercurius Media Capital",
    shortName: "MMC",
    tagline: "Turning Attention Into Ownership.",
    logoPath: "/mmc-logo.svg",
    colors: {
      dark: "#0B1220",      // primary dark (navy/near-black)
      accent: "#C9A961",    // gold accent
      bg: "#F7F5F0",        // off-white background
      text: "#1A1A1A",      // body text
      textMuted: "#6B6B6B", // helper text, labels
      border: "#E5E2DC",    // form field borders
      error: "#B91C1C",     // validation errors, word count over
      success: "#15803D",   // confirmation states
    },
  },

  // --- EMAIL ---
  EMAIL: {
    // The "from" address for all outbound email.
    // The domain (mmc.us) must be verified in Resend.
    from: "Mercurius Media Capital <mediastrategy@mmc.us>",

    // Every address in this array receives a copy of every submission (with .docx attached).
    // To add another stakeholder, just append their email to the list:
    //   mmcRecipients: ["matt@mmc.us", "new.person@mmc.us"],
    mmcRecipients: ["matt@mmc.us"],

    // If the submission API fails, the error is emailed here.
    errorRecipient: "matt@mmc.us",

    // Subjects
    prospectConfirmationSubject: "Your MMC Media Brief — Confirmation",
    mmcNotificationSubject: "New MMC Media Brief Submitted",
  },

  // --- URLs ---
  // Used to build download links inside outbound emails.
  // Overridden at runtime by the NEXT_PUBLIC_PRODUCTION_URL env var if set.
  PRODUCTION_URL: "https://brief.mmc.us",

  // --- PROSPECT CONFIRMATION COPY ---
  // {{DOWNLOAD_LINK}} will be replaced with the actual download URL at send time.
  PROSPECT_CONFIRMATION_BODY: `Thanks for submitting your media brief to Mercurius Media Capital. Our team is reviewing your information and will be in touch to schedule a time to walk through Media Strategy. You can download a copy of your completed brief here: {{DOWNLOAD_LINK}}. — Mercurius Media Capital`,

  // --- WORD LIMITS (soft — counter turns red but submission is not blocked) ---
  WORD_LIMITS: {
    companyDescription: 100,
    usp: 50,
    differentiators: 150,
    additionalPersonas: 150,
  },
} as const;

// Resolve production URL with env-var override (used by the API route when building download links).
export function getProductionUrl(): string {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_PRODUCTION_URL) {
    return process.env.NEXT_PUBLIC_PRODUCTION_URL;
  }
  return CONFIG.PRODUCTION_URL;
}
