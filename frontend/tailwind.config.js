/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          bg: "#0B0F1A",
          surface: "#111627",
          border: "#1E2540",
        },
        ink: {
          primary: "#E7E9F5",
          muted: "#8B92B2",
          faint: "#585F7E",
        },
        accent: {
          DEFAULT: "#7C5CFF",
          soft: "#A78BFA",
        },
        sentiment: {
          positive: "#34D399",
          negative: "#FB7185",
          neutral: "#FBBF24",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.35)",
        glow: "0 0 24px 0 rgba(124, 92, 255, 0.25)",
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        pulseBar: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        pulseBar: "pulseBar 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
