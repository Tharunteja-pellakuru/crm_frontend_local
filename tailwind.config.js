/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Calibri", "sans-serif"],
      },
      colors: {
        primary: "#18254D",
        secondary: "#475569",
        background: "#F6F9F4",
        surface: "#FFFFFF",
        textPrimary: "#1C1C1C",
        textMuted: "#64748B",
        success: "#22C55E",
        warning: "#F59E0B",
        error: "#EF4444",
        info: "#3B82F6",
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "content-base": [
          "0.9375rem",
          { lineHeight: "1.6", letterSpacing: "0em" },
        ],
        "content-sm": ["0.8125rem", { lineHeight: "1.5" }],
        "content-lg": [
          "1.0625rem",
          { lineHeight: "1.6", letterSpacing: "0em" },
        ],
        "sidebar-nav": [
          "0.75rem",
          { lineHeight: "1.4", fontWeight: "500" },
        ],
        "sidebar-badge": ["0.625rem", { lineHeight: "1" }],
      },
      fontWeight: {
        normal: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
      },
    },
  },
  plugins: [],
}
