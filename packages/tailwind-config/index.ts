import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";
const { fontFamily } = defaultTheme;

export default {
  content: [
    "./pages/**/*.{ts,tsx,js,jsx}",
    "./components/**/*.{ts,tsx,js,jsx}",
    "./app/**/*.{ts,tsx,js,jsx}",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  darkMode: ["class"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      grayscale: {
        25: "25%",
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
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
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      fontSize: {
        xs: "0.625rem",
        xxs: "0.5525rem",
        "2xxs": "0.5rem",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
        heading: ["var(--font-heading)", ...fontFamily.sans],
        serif: ["var(--font-serif)", ...fontFamily.serif],
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        ripple: {
          "0%, 100%": {
            transform: "scale(1)",
            opacity: "1",
          },
          "50%": {
            transform: "scale(1.5)",
            opacity: "5",
          },
        },
        levitate: {
          "0%, 100%": {
            transform: "translateY(0)",
          },
          "50%": {
            transform: "translateY(-10px)",
          },
        },
        "concentric-waves": {
          "0%": {
            opacity: "0",
            transform: "translate(-50%, -50%) scale(0.9)",
          },
          "40%, 50%": {
            opacity: "var(--opacity)",
            transform: "translate(-50%, -50%) scale(1)",
          },
          "100%": {
            opacity: "0",
          },
        },
        "pulse-in": {
          "0%": {
            opacity: "0",
            transform: "scale(1)",
          },
          "50%": {
            transform: "scale(1.05)",
          },
          "80%": {
            transform: "scale(0.95)",
          },
          "100%": {
            opacity: "var(--opacity)",
            transform: "none",
          },
        },
        "appear-in": {
          "0%": {
            opacity: "0",
            transform: "translateX(var(--x))",
          },
          "100%": {
            opacity: "var(--opacity)",
            transform: "none",
          },
        },
        marquee: {
          "100%": {
            transform: "translateY(-50%)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        marquee: "marquee var(--marquee-duration) linear infinite",
        "circle-ripple": "ripple 20s linear infinite",
        levitate: "levitate 8s cubic-bezier(0.25, 0.1, 0.25, 1) infinite",
        "concentric-ripple":
          "concentric-waves var(--waves-duration) ease-out infinite normal backwards running calc(500ms + var(--delay,0s))",
        "pulse-in": "pulse-in 750ms ease-in-out 125ms 1 normal both running",
        "appear-in":
          "appear-in 500ms ease-out 1 normal both running calc(300ms + (var(--stagger,0) * 225ms))",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
