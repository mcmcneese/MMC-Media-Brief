import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CONFIG } from "@/lib/config";

export const metadata: Metadata = {
  title: "Media Brief · Talaria",
  description:
    "Submit your Media Brief to Mercurius Media Capital — a media-for-equity investment firm.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Media Brief · Talaria",
    description: CONFIG.BRAND.tagline,
  },
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: CONFIG.BRAND.colors.bg,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-mmc-bg font-sans text-mmc-text antialiased">{children}</body>
    </html>
  );
}
