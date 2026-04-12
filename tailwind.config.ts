import type { Config } from "tailwindcss"

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./public/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: "#00C2FF",
      },
      fontFamily: {
        display: ["var(--font-syne)"],
        mono: ["var(--font-mono)"],
        inter: ["var(--font-inter)"],
      },
      borderRadius: {
        xl: "0.75rem",
      },
    },
  },
  plugins: [],
  safelist: [
    // Rounded utilities
    "rounded-xl",
    "rounded-full",
    "rounded-lg",
    "rounded-md",
    
    // Glass morphism
    "bg-white/[0.03]",
    "border-white/[0.07]",
    "text-white/[0.06]",
    "bg-white/[0.01]",
    "bg-white/[0.05]",
    "border-white/[0.06]",
    
    // Neon colors
    "border-[#00C2FF]/20",
    "hover:border-[#00C2FF]/40",
    "text-[#00C2FF]",
    "bg-[#050505]",
    
    // Backdrop
    "backdrop-blur-xl",
    
    // Borders
    "border",
  ],
} satisfies Config