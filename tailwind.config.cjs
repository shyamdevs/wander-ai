/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        apple: {
          text: "#f8fafc",
          muted: "#94a3b8",
          blue: "#38bdf8",
        },
        obsidian: {
          950: "#070b14",
          900: "#0f131d",
          850: "#111622",
          800: "#171c26",
        },
        cyan: { 400: "#38bdf8", 500: "#0ea5e9" },
        amber: { 500: "#f59e0b" },
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Inter", "ui-sans-serif", "system-ui"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular"],
      },
      boxShadow: {
        glass: "0 18px 55px rgba(0,0,0,.38)",
        cyan: "0 0 22px -4px rgba(56,189,248,.42)",
      },
    },
  },
  plugins: [],
};
