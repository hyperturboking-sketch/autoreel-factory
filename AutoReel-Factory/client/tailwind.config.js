/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: "#7c3aed",
      },
      boxShadow: {
        glow: "0 0 60px rgba(124, 58, 237, 0.35)",
      },
    },
  },
  plugins: [],
};
