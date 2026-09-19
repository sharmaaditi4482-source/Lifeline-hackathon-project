import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        blood: {
          DEFAULT: "#A8201A",
          light: "#C4302A",
          50: "rgba(168, 32, 26, 0.05)",
          10: "rgba(168, 32, 26, 0.10)",
        },
        ink: {
          DEFAULT: "#1C1917",
          80: "rgba(28, 25, 23, 0.80)",
          60: "rgba(28, 25, 23, 0.60)",
          40: "rgba(28, 25, 23, 0.40)",
          20: "rgba(28, 25, 23, 0.20)",
          10: "rgba(28, 25, 23, 0.10)",
          5: "rgba(28, 25, 23, 0.05)",
        },
        clay: "#F7F3EE",
      },
      fontFamily: {
        display: ["'Fraunces'", "Georgia", "serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "Menlo", "monospace"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
      animation: {
        "fade-slide-up": "fadeSlideUp 0.4s ease-out both",
        "fade-in": "fadeIn 0.35s ease-out both",
      },
      keyframes: {
        fadeSlideUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
