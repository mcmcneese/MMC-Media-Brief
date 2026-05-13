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
          // Brand
          purple: "#5D2B5E",      // primary brand purple (H1s, primary CTAs)
          purpleDeep: "#3A1A3D",  // mid-tone for gradients
          purpleDark: "#2A1230",  // darkest, gradient anchor
          gold: "#B89043",        // brand gold (numbers, rules, kicker labels, hero CTA)
          goldLight: "#D4B370",   // hover / highlight states

          // Surfaces
          cream: "#F5F2EC",       // warm off-white background
          creamDeep: "#E8E3D7",   // accent cream
          white: "#FFFFFF",

          // Text
          text: "#2A2A2A",        // charcoal body
          muted: "#6B6B6B",       // helper text, labels

          // Utility
          border: "#E0DACD",      // warm grey border
          error: "#B91C1C",
          success: "#15803D",

          // Legacy aliases kept for any existing class refs
          dark: "#2A2A2A",        // mapped to charcoal
          accent: "#B89043",      // mapped to gold
          bg: "#F5F2EC",          // mapped to cream
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
