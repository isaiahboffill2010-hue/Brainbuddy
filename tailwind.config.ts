import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#4F7CFF",
          foreground: "#ffffff",
          50: "#EEF3FF",
          100: "#D9E5FF",
          200: "#B3CBFF",
          300: "#80A8FF",
          400: "#4F7CFF",
          500: "#3361F5",
          600: "#1A47E0",
        },
        purple: {
          DEFAULT: "#8B7FFF",
          50: "#F0EDFF",
          100: "#DDD9FF",
          200: "#C0B8FF",
          300: "#A096FF",
          400: "#8B7FFF",
          500: "#7062F5",
          600: "#5748E0",
        },
        yellow: {
          DEFAULT: "#FFC857",
          50: "#FFFBEE",
          100: "#FFF3CC",
          200: "#FFE599",
          300: "#FFD566",
          400: "#FFC857",
          500: "#F5AD2E",
          600: "#E09315",
        },
        brand: {
          blue: "#4F7CFF",
          purple: "#8B7FFF",
          yellow: "#FFC857",
          bg: "#F7FAFF",
          dark: "#1F2A44",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "#FFC857",
          foreground: "#1F2A44",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
        "3xl": "calc(var(--radius) + 16px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gradient-hero": "linear-gradient(135deg, rgba(79,124,255,0.1) 0%, rgba(139,127,255,0.1) 50%, rgba(22,211,238,0.1) 100%)",
        "gradient-glass": "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
        "gradient-glow": "linear-gradient(135deg, rgba(139,127,255,0.2) 0%, rgba(79,124,255,0.2) 50%, rgba(22,211,238,0.2) 100%)",
        "noise-texture": "url('data:image/svg+xml,%3Csvg viewBox=\"0 0 256 256\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noiseFilter\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.9\" numOctaves=\"4\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noiseFilter)\"/%3E%3C/svg%3E')",
      },
      boxShadow: {
        card: "0 1px 4px rgba(79,124,255,0.06), 0 4px 16px rgba(79,124,255,0.08)",
        "card-hover": "0 4px 12px rgba(79,124,255,0.1), 0 12px 32px rgba(79,124,255,0.14)",
        blue: "0 8px 32px rgba(79,124,255,0.25)",
        purple: "0 8px 32px rgba(139,127,255,0.25)",
        yellow: "0 8px 32px rgba(255,200,87,0.3)",
        soft: "0 2px 8px rgba(31,42,68,0.06), 0 1px 2px rgba(31,42,68,0.04)",
        glass: "0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.1)",
        "glass-hover": "0 12px 40px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.15)",
        glow: "0 0 20px rgba(139,127,255,0.3), 0 0 40px rgba(79,124,255,0.2)",
        "glow-purple": "0 0 20px rgba(139,127,255,0.4), 0 0 40px rgba(139,127,255,0.2)",
        "glow-blue": "0 0 20px rgba(79,124,255,0.4), 0 0 40px rgba(79,124,255,0.2)",
        "glow-cyan": "0 0 20px rgba(22,211,238,0.4), 0 0 40px rgba(22,211,238,0.2)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "glow-pulse": {
          from: { boxShadow: "0 0 20px rgba(139,127,255,0.3)" },
          to: { boxShadow: "0 0 30px rgba(139,127,255,0.6)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        float: "float 3s ease-in-out infinite",
        "slide-up": "slide-up 0.4s ease-out both",
        "pulse-soft": "pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite alternate",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
