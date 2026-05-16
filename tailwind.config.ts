import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          900: "#0c4a6e",
        },
        gold: {
          300: "#fcd34d",
          400: "#f59e0b",
          500: "#d97706",
          600: "#b45309",
        },
        wc: {
          dark:    "#080e1a",
          navy:    "#0d1f3c",
          mid:     "#132947",
          surface: "#1a3460",
        },
      },
      backgroundImage: {
        "wc-header": "linear-gradient(135deg, #080e1a 0%, #0d1f3c 60%, #132947 100%)",
        "gold-shine": "linear-gradient(135deg, #f59e0b 0%, #fcd34d 50%, #d97706 100%)",
      },
      boxShadow: {
        "gold":   "0 0 20px rgba(245,158,11,0.25)",
        "card":   "0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
        "card-hover": "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
