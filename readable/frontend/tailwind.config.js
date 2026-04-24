/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        sea: "#0f766e",
        mist: "#ecfeff",
        amberglow: "#f59e0b",
        blush: "#fff7ed",
      },
      boxShadow: {
        soft: "0 20px 60px -30px rgba(15, 23, 42, 0.45)",
      },
      backgroundImage: {
        "hero-radial":
          "radial-gradient(circle at top left, rgba(20,184,166,0.22), transparent 36%), radial-gradient(circle at bottom right, rgba(245,158,11,0.18), transparent 32%)",
      },
    },
  },
  plugins: [],
};
