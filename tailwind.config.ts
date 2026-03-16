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
        sidebar: {
          DEFAULT: "#0f1117",
          hover: "#1a1f2e",
          border: "#1e2537",
        },
        brand: {
          gold: "#c9a84c",
          "gold-light": "#e8c96a",
          "gold-dark": "#a8883a",
          navy: "#0f1117",
          "navy-light": "#1a1f2e",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
