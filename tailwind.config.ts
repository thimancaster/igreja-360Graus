import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        sans:  ["Geist", "Inter", "system-ui", "sans-serif"],
        mono:  ["GeistMono", "JetBrains Mono", "monospace"],
        geist: ["Geist", "Inter", "system-ui", "sans-serif"],
      },

      colors: {
        border:     "hsl(var(--border))",
        input:      "hsl(var(--input))",
        ring:       "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        surface: {
          DEFAULT: "hsl(var(--surface))",
          2:       "hsl(var(--surface-2))",
          3:       "hsl(var(--surface-3))",
        },
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT:             "hsl(var(--sidebar))",
          foreground:          "hsl(var(--sidebar-foreground))",
          primary:             "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent:              "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border:              "hsl(var(--sidebar-border))",
          ring:                "hsl(var(--sidebar-ring))",
        },
        aurora: {
          1: "hsl(var(--aurora-1))",
          2: "hsl(var(--aurora-2))",
          3: "hsl(var(--aurora-3))",
          4: "hsl(var(--aurora-4))",
        },
        // Semantic status colors
        success: {
          DEFAULT:    "hsl(142 71% 45%)",
          foreground: "hsl(0 0% 100%)",
        },
        warning: {
          DEFAULT:    "hsl(38 92% 50%)",
          foreground: "hsl(0 0% 5%)",
        },
        info: {
          DEFAULT:    "hsl(217 91% 60%)",
          foreground: "hsl(0 0% 100%)",
        },
      },

      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      backgroundImage: {
        "aurora":         "var(--gradient-aurora)",
        "aurora-soft":    "var(--gradient-aurora-soft)",
        "gradient-primary":  "var(--gradient-primary)",
        "gradient-success":  "var(--gradient-success)",
        "gradient-danger":   "var(--gradient-danger)",
        "gradient-warning":  "var(--gradient-warning)",
        "mesh":           "var(--gradient-mesh)",
      },

      boxShadow: {
        "glow-primary":   "var(--glow-primary)",
        "glow-secondary": "var(--glow-secondary)",
        "glow-teal":      "var(--glow-teal)",
        "glass":          "var(--glass-shadow)",
        "glass-lg":       "var(--glass-shadow-lg)",
      },

      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        "aurora-drift": {
          "0%":   { transform: "translate(0px, 0px) scale(1)" },
          "33%":  { transform: "translate(15px, -10px) scale(1.05)" },
          "66%":  { transform: "translate(-10px, 8px) scale(0.97)" },
          "100%": { transform: "translate(8px, -5px) scale(1.02)" },
        },
        "shimmer": {
          "100%": { transform: "translateX(100%)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 5px  hsl(var(--aurora-1) / 0.25)" },
          "50%":      { boxShadow: "0 0 25px hsl(var(--aurora-1) / 0.55)" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "gradient-shift": {
          "0%":   { backgroundPosition: "0% 50%" },
          "50%":  { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
      },

      animation: {
        "accordion-down":  "accordion-down 0.2s ease-out",
        "accordion-up":    "accordion-up 0.2s ease-out",
        "aurora-drift":    "aurora-drift 12s ease-in-out infinite alternate",
        "shimmer":         "shimmer 2s infinite",
        "pulse-glow":      "pulse-glow 2.5s ease-in-out infinite",
        "fade-in-up":      "fade-in-up 0.4s ease-out both",
        "gradient-shift":  "gradient-shift 4s ease infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
