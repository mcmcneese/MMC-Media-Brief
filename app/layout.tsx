import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { CONFIG } from "@/lib/config";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MMC Media Brief",
  description:
    "Submit your Media Brief to Mercurius Media Capital — a media-for-equity investment firm.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "MMC Media Brief",
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
    <html lang="en" className={montserrat.variable}>
      <body className="bg-mmc-bg font-sans text-mmc-text antialiased">{children}</body>
    </html>
  );
}
