import { CONFIG } from "@/lib/config";

interface MMCLogoProps {
  className?: string;
  height?: number;
  priority?: boolean;
  /**
   * "purple" → logo for light surfaces (default)
   * "white"  → logo for dark surfaces (hero, dark headers)
   */
  variant?: "purple" | "white";
}

// Renders the MMC logo from /public. Plain <img> so Next.js doesn't try to
// optimize a transparent brand asset (which it refuses by default for SVG
// and re-encodes unhelpfully for transparent PNGs).
export default function MMCLogo({
  className = "",
  height = 40,
  priority = false,
  variant = "purple",
}: MMCLogoProps) {
  const src =
    variant === "white" ? CONFIG.BRAND.logoWhitePath : CONFIG.BRAND.logoPath;

  return (
    <span
      className={`inline-flex items-center ${className}`}
      style={{ height }}
      aria-label={CONFIG.BRAND.name}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={CONFIG.BRAND.name}
        style={{ height: "100%", width: "auto", display: "block" }}
        loading={priority ? "eager" : "lazy"}
      />
    </span>
  );
}
