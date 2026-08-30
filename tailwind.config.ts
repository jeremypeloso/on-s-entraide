import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#FFF8EF",
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
        display: ["Baloo 2", "sans-serif"],
        body: ["Plus Jakarta Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
