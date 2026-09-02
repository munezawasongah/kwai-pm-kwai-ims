import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0f4c3a",
          light: "#1a6b52",
          dark: "#0a3628",
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
