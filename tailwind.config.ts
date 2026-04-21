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
          dark: "#0B1220",
          accent: "#C9A961",
          bg: "#F7F5F0",
          text: "#1A1A1A",
          muted: "#6B6B6B",
          border: "#E5E2DC",
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
