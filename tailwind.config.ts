import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        mmc: {
          dark: "#1A1A1A",       // primary near-black
          accent: "#525252",     // medium grey (replaces former gold)
          bg: "#FAFAFA",         // cool off-white background
          text: "#1A1A1A",       // body text
          muted: "#6B6B6B",      // helper text, labels
          border: "#E5E5E5",     // cool light grey for borders
          error: "#B91C1C",
          success: "#15803D",
        },
      },
      fontFamily: {
        sans: ["var(--font-montserrat)", "Montserrat", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
