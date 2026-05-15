"use client";

import MMCLogo from "./MMCLogo";
import { ChevronDown } from "lucide-react";
import { CONFIG } from "@/lib/config";

interface HeroProps {
  onBegin: () => void;
  /**
   * Optional — when present, renders a small "Prepared for {company}" line
   * under the headline. Set automatically when the prospect opens a
   * tokenized link from the admin area.
   */
  prospectCompanyName?: string;
}

/**
 * Visually echoes the MMC deck cover: deep purple gradient field with ambient
 * motion, MMC white logo top-left, a small gold tracker label, a horizontal
 * gold rule, a big bold white headline (with one word styled in gold), body
 * copy, and a gold CTA. Subtle grain and slowly drifting radial highlights
 * (defined in globals.css under `.mmc-hero`) give the background life
 * without distracting from the form below.
 */
export default function Hero({ onBegin, prospectCompanyName }: HeroProps) {
  // Split the headline so we can color the last word gold (like "Funnel" on the deck).
  // The split heuristic: if the headline contains the word "Brief", color it gold.
  // Otherwise color the final word.
  const headline = CONFIG.HERO.headline;
  const { lead, accent } = splitHeadline(headline);

  return (
    <section
      aria-labelledby="hero-heading"
      className="mmc-hero w-full px-4 pt-12 pb-16 text-white sm:px-8 sm:pt-16 sm:pb-20"
    >
      <div className="mx-auto w-full max-w-5xl">
        {/* Top bar: white logo */}
        <div className="mb-10 flex items-center justify-between sm:mb-14">
          <MMCLogo variant="white" height={80} priority />
          <span className="hidden text-xs font-semibold uppercase tracking-[0.18em] text-mmc-goldLight sm:inline">
            Media Brief · 2026
          </span>
        </div>

        {/* Kicker + rule */}
        <div className="mb-5 flex items-center gap-4">
          <span className="mmc-kicker text-mmc-goldLight">
            Media-for-Equity Partnership
          </span>
          <span className="mmc-rule" />
        </div>

        {/* Headline */}
        <h1
          id="hero-heading"
          className="max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl"
        >
          {lead}{" "}
          <span className="text-mmc-goldLight">{accent}</span>
        </h1>

        {/* Personalized "Prepared for X" line when token is present */}
        {prospectCompanyName ? (
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.16em] text-mmc-goldLight">
            Prepared for {prospectCompanyName}
          </p>
        ) : null}

        {/* Body */}
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">
          {CONFIG.HERO.intro}
        </p>
        <p className="mt-3 max-w-2xl text-sm text-white/65">{CONFIG.HERO.meta}</p>

        {/* CTA */}
        <div className="mt-10">
          <button
            type="button"
            onClick={onBegin}
            className="inline-flex items-center gap-2 rounded-md bg-mmc-gold px-7 py-3.5 text-sm font-semibold uppercase tracking-wider text-mmc-purpleDark transition hover:bg-mmc-goldLight hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-mmc-goldLight focus:ring-offset-4 focus:ring-offset-mmc-purpleDark"
          >
            {CONFIG.HERO.cta}
            <ChevronDown size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}

function splitHeadline(s: string): { lead: string; accent: string } {
  const trimmed = s.trim();
  if (/brief/i.test(trimmed)) {
    // Color the word "Brief" (and anything after it) gold
    const idx = trimmed.search(/brief/i);
    return {
      lead: trimmed.slice(0, idx).trim(),
      accent: trimmed.slice(idx).trim(),
    };
  }
  // Otherwise color the last word gold
  const parts = trimmed.split(/\s+/);
  if (parts.length <= 1) return { lead: "", accent: trimmed };
  const accent = parts.pop()!;
  return { lead: parts.join(" "), accent };
}
