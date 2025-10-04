/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        mint: { DEFAULT: "#ECF5F3" },
        ink: { DEFAULT: "#2E4B4F" },
        stone: { DEFAULT: "#6C7B7D" }
      }
    }
  },
  plugins: []
};