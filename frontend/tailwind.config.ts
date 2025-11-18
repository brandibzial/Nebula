import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        nebula: {
          50: "#eef7ff",
          100: "#d8ecff",
          200: "#b6dcff",
          300: "#85c7ff",
          400: "#4ea9ff",
          500: "#1c86ff",
          600: "#0d68e6",
          700: "#0b53b4",
          800: "#0d468f",
          900: "#103c73"
        }
      },
      backgroundImage: {
        "nebula-gradient":
          "radial-gradient(1000px 600px at 20% 10%, rgba(76,0,255,0.25), transparent 60%), radial-gradient(800px 400px at 80% 0%, rgba(0,255,209,0.25), transparent 60%), radial-gradient(900px 500px at 50% 100%, rgba(255,0,128,0.2), transparent 60%)"
      }
    }
  },
  plugins: []
};

export default config;




