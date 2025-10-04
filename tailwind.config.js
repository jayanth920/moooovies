/** @type {import('tailwindcss').Config} */
  module.exports = {
    content: [".pages/**/*.{js,jsx,ts,tsx}", "*.{js,ts,jsx,tsx,mdx}"],
    theme: {
      extend: {
        animation: {
          "line-shadow": "line-shadow 8s linear infinite",
          "shiny-text": "shiny-text 8s infinite",

        },
        keyframes: {
          "line-shadow": {
            "0%": { backgroundPosition: "0% 0%" },
            "100%": { backgroundPosition: "100% 100%" },
          },
          "shiny-text": {
            "0%, 90%, 100%": {
              "background-position": "calc(-100% - var(--shiny-width)) 0",
            },
            "30%, 60%": {
              "background-position": "calc(100% + var(--shiny-width)) 0",
            },
          },
        },
      },
    },
    plugins: [],
  }
  
  