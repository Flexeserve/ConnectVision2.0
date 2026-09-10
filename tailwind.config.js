import { heroui } from "@heroui/react";
import colors from "tailwindcss/colors";

const withAlpha = (v) => `rgb(var(${v}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/*/dist/**/*.{js,jsx,ts,tsx}",
    "./node_modules/@tremor/**/*.{js,ts,jsx,tsx,mjs}",
  ],
  // Tremor composes chart series color classes dynamically — safelist the
  // ones these widgets pass to Tremor charts so PurgeCSS keeps them.
  safelist: [
    {
      pattern:
        /^(bg|text|border|ring|stroke|fill)-(gray|orange|blue|emerald|red|amber)-(100|200|300|400|500|600|700)$/,
      variants: ["hover", "ui-selected"],
    },
  ],
  theme: {
    extend: {
      colors: {
        // --- app design tokens ---
        canvas: withAlpha("--canvas"),
        surface: {
          DEFAULT: withAlpha("--surface"),
          muted: withAlpha("--surface-muted"),
          hover: withAlpha("--surface-hover"),
        },
        ink: {
          DEFAULT: withAlpha("--ink"),
          muted: withAlpha("--ink-muted"),
          subtle: withAlpha("--ink-subtle"),
        },
        line: {
          DEFAULT: withAlpha("--line"),
          strong: withAlpha("--line-strong"),
        },
        accent: {
          DEFAULT: withAlpha("--accent"),
          fg: withAlpha("--accent-fg"),
        },
        success: withAlpha("--success"),
        danger: withAlpha("--danger"),
        warning: withAlpha("--warning"),
        info: withAlpha("--info"),

        // --- Tremor palette (light + dark) ---
        tremor: {
          brand: {
            faint: colors.orange[50],
            muted: colors.orange[200],
            subtle: colors.orange[400],
            DEFAULT: "#d94d14",
            emphasis: colors.orange[700],
            inverted: colors.white,
          },
          background: {
            muted: colors.gray[50],
            subtle: colors.gray[100],
            DEFAULT: colors.white,
            emphasis: colors.gray[700],
          },
          border: { DEFAULT: colors.gray[200] },
          ring: { DEFAULT: colors.gray[200] },
          content: {
            subtle: colors.gray[400],
            DEFAULT: colors.gray[500],
            emphasis: colors.gray[700],
            strong: colors.gray[900],
            inverted: colors.white,
          },
        },
        "dark-tremor": {
          brand: {
            faint: "#221410",
            muted: "#7c2d12",
            subtle: colors.orange[800],
            DEFAULT: "#f0672f",
            emphasis: colors.orange[400],
            inverted: colors.gray[950],
          },
          background: {
            muted: "#1f1f22",
            subtle: colors.zinc[800],
            DEFAULT: colors.zinc[900],
            emphasis: colors.zinc[300],
          },
          border: { DEFAULT: colors.zinc[700] },
          ring: { DEFAULT: colors.zinc[700] },
          content: {
            subtle: colors.zinc[600],
            DEFAULT: colors.zinc[500],
            emphasis: colors.zinc[200],
            strong: colors.zinc[50],
            inverted: colors.zinc[950],
          },
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      borderRadius: {
        widget: "0.875rem",
        "tremor-small": "0.375rem",
        "tremor-default": "0.5rem",
        "tremor-full": "9999px",
      },
      boxShadow: {
        widget: "0 1px 2px rgb(0 0 0 / 0.04), 0 1px 3px rgb(0 0 0 / 0.06)",
        "widget-dark": "0 1px 2px rgb(0 0 0 / 0.4), 0 2px 6px rgb(0 0 0 / 0.3)",
        "tremor-input": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "tremor-card":
          "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        "tremor-dropdown":
          "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        "dark-tremor-input": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "dark-tremor-card":
          "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        "dark-tremor-dropdown":
          "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      },
      fontSize: {
        "tremor-label": ["0.75rem", { lineHeight: "1rem" }],
        "tremor-default": ["0.875rem", { lineHeight: "1.25rem" }],
        "tremor-title": ["1.125rem", { lineHeight: "1.75rem" }],
        "tremor-metric": ["1.875rem", { lineHeight: "2.25rem" }],
      },
    },
  },
  plugins: [require("tailwindcss-animate"), heroui()],
};
