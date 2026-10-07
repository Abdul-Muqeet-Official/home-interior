// tailwind.config.js
/**
 * tailwind.config.js
 * HOME INTERIOR design tokens — quiet luxury / editorial / architectural.
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* Surfaces */
        canvas: "#FAFAF8",
        pure: "#FFFFFF",
        surface: "#F3EEE7",
        /* Accents */
        champagne: "#C5A880",
        gold: {
          DEFAULT: "#C5A880",
          soft: "#D9C4A2",
          deep: "#A98B60",
        },
        /* Ink */
        charcoal: "#121214",
        dark: "#1E1E24",
        muted: "#77736C",
        /* Hairlines */
        line: "rgba(18, 18, 20, 0.10)",
        "line-strong": "rgba(18, 18, 20, 0.18)",
        "line-light": "rgba(255, 255, 255, 0.16)",
        /* Status */
        success: "#2F6F4F",
        danger: "#A4423A",
        /* Back-compat aliases used by earlier components */
        brand: {
          white: "#FAFAF8",
          ivory: "#FDFBF7",
          pure: "#FFFFFF",
          gold: "#C5A880",
          champagne: "#F3EEE7",
          charcoal: "#121214",
          slate: "#1E1E24",
          dark: "#121214",
          green: "#0F382C",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "'Plus Jakarta Sans'",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        serif: [
          "var(--font-serif)",
          "'Cormorant Garamond'",
          "'Times New Roman'",
          "serif",
        ],
      },
      borderRadius: {
        card: "18px",
        panel: "14px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(18, 18, 20, 0.04), 0 24px 60px -34px rgba(18, 18, 20, 0.28)",
        lift: "0 30px 70px -40px rgba(18, 18, 20, 0.45)",
      },
      letterSpacing: {
        editorial: "0.34em",
        wide2: "0.22em",
      },
      maxWidth: {
        editorial: "1280px",
      },
      transitionTimingFunction: {
        editorial: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

