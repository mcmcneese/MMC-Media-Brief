import TalariaLockup from "./TalariaLockup";

interface MMCLogoProps {
  className?: string;
  height?: number;
  priority?: boolean;
  variant?: "purple" | "white";
}

// Kept under its original name so existing pages need no change: every page
// that showed the old logo now shows the Talaria wordmark.
export default function MMCLogo({ className = "" }: MMCLogoProps) {
  return (
    <span className={`inline-flex ${className}`}>
      <TalariaLockup />
    </span>
  );
}
