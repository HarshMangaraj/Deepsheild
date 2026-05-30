import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-cormorant)", "Georgia", "serif"],
        mono:    ["var(--font-dm-mono)", "monospace"],
        sans:    ["var(--font-cormorant)", "Georgia", "serif"],
      },
      colors: {
        cream:     "#FAF8F3",
        parchment: "#F5F0E8",
        sand:      "#E8E0D0",
        brass:     "#B8965A",
        "brass-light": "#D4B07A",
        charcoal:  "#1A1814",
        ink:       "#2C2820",
        graphite:  "#4A4540",
        stone:     "#8A8278",
        mist:      "#C8C0B4",
        sage:      "#7A8C6E",
        blush:     "#C4856A",
      },
    },
  },
  plugins: [],
};

export default config;