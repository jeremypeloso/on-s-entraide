import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#FFFFFF",
        ink: "#22223B",
        coral: "#FF6B5B",
        "coral-dark": "#E8503F",
        sun: "#FFC93C",
        mint: "#2FC1A3",
        sky: "#4D8DFF",
        lilac: "#9B6BFF",
        pink: "#FF6FA5",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
