"use client";

import MMCLogo from "./MMCLogo";
import { ChevronDown } from "lucide-react";
import { CONFIG } from "@/lib/config";

interface HeroProps {
  onBegin: () => void;
}

export default function Hero({ onBegin }: HeroProps) {
  return (
    <section
      aria-labelledby="hero-heading"
      className="mx-auto w-full max-w-3xl px-4 pt-12 pb-12 text-center sm:px-6 sm:pt-16 sm:pb-16"
    >
      <div className="mb-8 flex justify-center">
        <MMCLogo height={72} priority />
      </div>
      <h1
        id="hero-heading"
        className="text-3xl font-semibold tracking-tight text-mmc-text sm:text-4xl"
      >
        {CONFIG.HERO.headline}
      </h1>
      <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-mmc-muted sm:text-lg">
        {CONFIG.HERO.intro}
      </p>
      <p className="mx-auto mt-3 max-w-xl text-sm text-mmc-muted">{CONFIG.HERO.meta}</p>
      <button
        type="button"
        onClick={onBegin}
        className="mt-8 inline-flex items-center gap-2 rounded-md bg-mmc-accent px-7 py-3.5 text-sm font-semibold text-white transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-mmc-accent focus:ring-offset-2 focus:ring-offset-mmc-bg"
      >
        {CONFIG.HERO.cta}
        <ChevronDown size={16} aria-hidden="true" />
      </button>
    </section>
  );
}
