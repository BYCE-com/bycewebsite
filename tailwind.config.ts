import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"General Sans"', "Arial", "sans-serif"],
        display: ["Anybody", '"Arial Black"', "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
