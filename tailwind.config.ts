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
        // Token names are kept from the original theme so components need no
        // change; the values are the Talaria palette.
        mmc: {
          purple: "#111111",      // ink: headings, primary buttons
          purpleDeep: "#111111",
          purpleDark: "#111111",
          gold: "#2E9A94",        // deep aqua: focus rings, small accents
          goldLight: "#8EDCD7",   // aqua
          cream: "#F4F5F7",       // page ground
          creamDeep: "#ECEEF1",
          white: "#FFFFFF",
          text: "#111111",
          muted: "#5A606B",
          border: "#C9CDD3",
          error: "#B3261E",
          success: "#2E9A94",
          dark: "#111111",
          accent: "#111111",
          bg: "#F4F5F7",
        },
      },
      fontFamily: {
        sans: ["Geist", "system-ui", "sans-serif"],
        mono: ["Geist Mono", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
