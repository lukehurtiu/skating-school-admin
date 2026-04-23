import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        ice: {
          50:  "#f0f5fa",
          100: "#dce6f0",
          200: "#b8cde1",
          300: "#8baec9",
          400: "#5f8fb2",
          500: "#3d7199",
          600: "#2f5a7a",
          700: "#234560",
          800: "#1a3148",
          900: "#0f1e2d",
        },
        surface: "#f4f6f8",
        "surface-dark": "#1a1d21",
        "text-primary": "#1c2128",
        "text-muted": "#6b7885",
        success: "#2d7a3a",
        danger: "#c0392b",
      },
      borderRadius: {
        card: "10px",
        pill: "999px",
        btn: "8px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)",
        "card-hover": "0 4px 16px rgba(0,0,0,0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
