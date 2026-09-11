/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ibm: {
          blue: "#0f62fe",
          "blue-dark": "#0043ce",
          "blue-hover": "#0353e9",
          gray10: "#f4f4f4",
          gray20: "#e0e0e0",
          gray30: "#c6c6c6",
          gray60: "#6f6f6f",
          gray80: "#393939",
          gray100: "#161616",
          green: "#24a148",
          red: "#da1e28",
          yellow: "#f1c21b",
          purple: "#8a3ffc",
        },
      },
      fontFamily: {
        sans: ["IBM Plex Sans", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
