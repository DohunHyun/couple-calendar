export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FFFFFF",
        ink: "#121212",
        mist: "#F4F4F5",
        line: "#E8E8EC",
      },
      boxShadow: {
        sheet: "0 -12px 40px rgba(15, 23, 42, 0.10)",
      },
      keyframes: {
        rise: {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeUp: {
          "0%": { transform: "translateY(12px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        rise: "rise 240ms ease-out",
        fadeUp: "fadeUp 320ms ease-out",
      },
    },
  },
  plugins: [],
};
