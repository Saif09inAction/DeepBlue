/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ocean: {
          50:  "#e0f2fe",
          100: "#bae6fd",
          200: "#7dd3fc",
          300: "#38bdf8",
          400: "#0ea5e9",
          500: "#0284c7",
          600: "#0369a1",
          700: "#075985",
          800: "#0c4a6e",
          900: "#082f49",
        },
        deep: {
          900: "#020817",
          800: "#050d1f",
          700: "#0a1628",
          600: "#0d1f35",
          500: "#112542",
          400: "#1a3554",
          300: "#1e3f63",
        },
        cyber: {
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      backgroundImage: {
        "ocean-gradient": "linear-gradient(135deg, #020817 0%, #0c4a6e 50%, #082f49 100%)",
        "card-gradient":  "linear-gradient(135deg, rgba(14,165,233,0.05) 0%, rgba(6,182,212,0.02) 100%)",
        "glow-blue":      "radial-gradient(circle, rgba(14,165,233,0.15) 0%, transparent 70%)",
      },
      animation: {
        "pulse-slow":  "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
        "float":       "float 6s ease-in-out infinite",
        "glow":        "glow 2s ease-in-out infinite alternate",
        "scan":        "scan 2s linear infinite",
        "flow":        "flow 3s ease-in-out infinite",
        "spin-slow":   "spin 8s linear infinite",
        "ping-slow":   "ping 2s cubic-bezier(0,0,0.2,1) infinite",
      },
      keyframes: {
        float: {
          "0%,100%": { transform: "translateY(0px)" },
          "50%":     { transform: "translateY(-8px)" },
        },
        glow: {
          "0%":   { boxShadow: "0 0 5px rgba(14,165,233,0.3)" },
          "100%": { boxShadow: "0 0 20px rgba(14,165,233,0.8), 0 0 40px rgba(14,165,233,0.3)" },
        },
        scan: {
          "0%":   { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        flow: {
          "0%,100%": { opacity: "0.4", transform: "scaleX(0.95)" },
          "50%":     { opacity: "1",   transform: "scaleX(1)" },
        },
      },
      boxShadow: {
        "ocean":     "0 0 20px rgba(14,165,233,0.2), 0 4px 24px rgba(0,0,0,0.4)",
        "ocean-lg":  "0 0 40px rgba(14,165,233,0.3), 0 8px 32px rgba(0,0,0,0.5)",
        "card":      "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
        "glow-blue": "0 0 30px rgba(14,165,233,0.4)",
        "glow-red":  "0 0 20px rgba(239,68,68,0.4)",
        "glow-green":"0 0 20px rgba(16,185,129,0.4)",
      },
    },
  },
  plugins: [],
};
