import type { Config } from "tailwindcss";

// WHY a custom config?
// Tailwind's default setup is good, but we need to:
// 1. Tell it where our components live (so it can purge unused styles in production)
// 2. Register our custom Google Fonts as CSS variables so Tailwind's font utilities use them
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // These match the CSS variable names we set in layout.tsx
        sans: ["var(--font-syne)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;