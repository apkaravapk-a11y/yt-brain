/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Material You tonal palette — driven by CSS vars per mode
        primary: "var(--md-primary)",
        "on-primary": "var(--md-on-primary)",
        "primary-container": "var(--md-primary-container)",
        "on-primary-container": "var(--md-on-primary-container)",
        secondary: "var(--md-secondary)",
        "on-secondary": "var(--md-on-secondary)",
        surface: "var(--md-surface)",
        "surface-1": "var(--md-surface-1)",
        "surface-2": "var(--md-surface-2)",
        "surface-3": "var(--md-surface-3)",
        "on-surface": "var(--md-on-surface)",
        "on-surface-variant": "var(--md-on-surface-variant)",
        outline: "var(--md-outline)",
        "outline-variant": "var(--md-outline-variant)",
      },
      fontFamily: {
        sans: ["Google Sans", "Roboto", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Consolas", "monospace"],
      },
      boxShadow: {
        "elev-1": "0 1px 2px rgba(0,0,0,.30), 0 1px 3px 1px rgba(0,0,0,.15)",
        "elev-2": "0 1px 2px rgba(0,0,0,.30), 0 2px 6px 2px rgba(0,0,0,.15)",
        "elev-3": "0 4px 8px 3px rgba(0,0,0,.15), 0 1px 3px rgba(0,0,0,.30)",
        "elev-4": "0 6px 10px 4px rgba(0,0,0,.15), 0 2px 3px rgba(0,0,0,.30)",
        glow: "0 0 30px var(--md-primary)",
      },
      transitionTimingFunction: {
        "md-emphasized": "cubic-bezier(0.2, 0.0, 0, 1.0)",
        "md-emphasized-decel": "cubic-bezier(0.05, 0.7, 0.1, 1.0)",
        "md-standard": "cubic-bezier(0.2, 0.0, 0, 1.0)",
      },
    },
  },
  plugins: [],
};
