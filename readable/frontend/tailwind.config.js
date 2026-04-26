/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'sans-serif'],
      },
      colors: {
        ink: "#1f2937",
        sea: "#3b82f6",
        mist: "#eff6ff",
        amberglow: "#f59e0b",
        blush: "#fdf4ff",
        cloud: "#f8fafc",
        navy: "#1e3a8a",
        primary: "#a855f7",
      },
      boxShadow: {
        soft: "0 28px 80px -40px rgba(17, 53, 97, 0.32)",
      },
      backgroundImage: {
        "hero-radial":
          "radial-gradient(circle at top left, rgba(168,85,247,0.15), transparent 34%), radial-gradient(circle at bottom right, rgba(59,130,246,0.15), transparent 32%), linear-gradient(145deg, rgba(255,255,255,0.95), rgba(243,244,246,0.95))",
      },
    },
  },
  plugins: [],
};
