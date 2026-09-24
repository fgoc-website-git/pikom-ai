import type { Config } from "tailwindcss";
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pikom: {
          blue: "#38A9E0",
          light: "#A7C9EF",
          dark: "#202427",
        },
      },
    },
  },
  plugins: [],
};
export default config;
