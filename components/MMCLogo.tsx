import { CONFIG } from "@/lib/config";

interface MMCLogoProps {
  className?: string;
  height?: number;
  priority?: boolean;
}

// Renders the MMC logo from /public. We use a plain <img> so Next.js doesn't
// try to optimize an SVG (which it refuses by default).
export default function MMCLogo({ className = "", height = 40, priority = false }: MMCLogoProps) {
  return (
    <span
      className={`inline-flex items-center ${className}`}
      style={{ height }}
      aria-label={CONFIG.BRAND.name}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={CONFIG.BRAND.logoPath}
        alt={CONFIG.BRAND.name}
        style={{ height: "100%", width: "auto", display: "block" }}
        loading={priority ? "eager" : "lazy"}
      />
    </span>
  );
}
