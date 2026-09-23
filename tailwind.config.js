const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        // --font-sans is set by next/font in app/layout.jsx.
        sans: ["var(--font-sans)", ...defaultTheme.fontFamily.sans],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"]
      },
      colors: {
        brand: {
          50: "#eefaf7", 100: "#d3f2ea", 200: "#a8e5d7", 300: "#6fd2bf",
          400: "#37b39f", 500: "#159c88", 600: "#0e7d6d", 700: "#0e5a54",
          800: "#0d4740", 900: "#0b3a34"
        }
      },
      fontSize: {
        // A real type scale, rather than everything defaulting to text-sm.
        "2xs": ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.02em" }]
      },
      letterSpacing: {
        tightest: "-0.03em"
      },
      boxShadow: {
        // Two-layer shadows: a tight contact shadow plus a soft ambient one.
        card: "0 1px 2px 0 rgb(15 23 42 / 0.04), 0 8px 24px -12px rgb(15 23 42 / 0.12)",
        "card-hover": "0 1px 2px 0 rgb(15 23 42 / 0.05), 0 12px 32px -12px rgb(15 23 42 / 0.18)",
        control: "0 1px 2px 0 rgb(15 23 42 / 0.05)"
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(2px)" },
          to: { opacity: "1", transform: "none" }
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" }
        }
      },
      animation: {
        "fade-in": "fade-in 180ms ease-out both",
        shimmer: "shimmer 1.6s infinite"
      }
    }
  },
  plugins: []
};
