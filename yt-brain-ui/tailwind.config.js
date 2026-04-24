/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        panel: "var(--panel)",
        accent: "var(--accent)",
        accent2: "var(--accent2)",
        text: "var(--text)",
        dim: "var(--dim)",
        border: "var(--border)",
        ok: "var(--ok)",
        warn: "var(--warn)",
        bad: "var(--bad)",
      },
      fontFamily: {
        mono: ['ui-monospace', 'Consolas', '"SF Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
