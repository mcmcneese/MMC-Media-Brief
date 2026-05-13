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
    logoPath: "/mmc-logo.png",         // purple logo for light surfaces
    logoWhitePath: "/mmc-logo-white.png", // white logo for dark surfaces (e.g. Hero)
    colors: {
      // Brand
      purple: "#5D2B5E",      // primary brand purple — H1s, primary CTAs
      purpleDeep: "#3A1A3D",
      purpleDark: "#2A1230",  // gradient anchor
      gold: "#B89043",        // brand gold — numbers, accents, hero CTA
      goldLight: "#D4B370",

      // Surfaces
      cream: "#F5F2EC",       // warm off-white body bg
      creamDeep: "#E8E3D7",
      white: "#FFFFFF",

      // Text
      text: "#2A2A2A",
      textMuted: "#6B6B6B",

      // Utility
      border: "#E0DACD",
      error: "#B91C1C",
      success: "#15803D",

      // Legacy aliases (kept for back-compat in older code paths)
      dark: "#2A2A2A",
      accent: "#B89043",
      bg: "#F5F2EC",
    },
  },

  // --- EMAIL ---
  EMAIL: {
    // The "from" address for all outbound email.
    //
    // Currently using Resend's built-in test sender `onboarding@resend.dev`.
    // Limitation: with this sender, Resend will ONLY deliver to the account
    // owner's email (matt@mmc.us). Prospect confirmation emails are
    // intentionally SKIPPED in the submit route — see `route.ts` for the guard.
    //
    // To send from `mediastrategy@mmc.us` instead, verify the `mmc.us` domain
    // in Resend (DNS records) and change this back to:
    //   "Mercurius Media Capital <mediastrategy@mmc.us>"
    from: "MMC Media Brief <onboarding@resend.dev>",

    // Every address in this array receives a copy of every submission (with .docx attached).
    // To add another stakeholder, just append their email to the list:
    //   mmcRecipients: ["matt@mmc.us", "new.person@mmc.us"],
    // NOTE: while using the resend.dev sender, only the account owner's email
    // (matt@mmc.us) will actually receive mail — Resend blocks all others.
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
  PRODUCTION_URL: "https://mmc-media-brief.vercel.app",

  // --- HERO (introductory section above the form) ---
  // Shown above Step 1 with a "Begin Brief" button that auto-scrolls into the form.
  HERO: {
    headline: "Welcome to the MMC Media Brief",
    intro:
      "Mercurius Media Capital invests in growth companies through media-for-equity partnerships. This brief helps our team understand your business, audience, and campaign goals so we can build a media strategy that drives real outcomes.",
    meta:
      "Takes about 10 minutes. Your progress auto-saves — you can resume any time from the same link.",
    cta: "Begin Brief",
  },

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
