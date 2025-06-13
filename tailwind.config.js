module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        purple: require('tailwindcss/colors').purple,
        red: require('tailwindcss/colors').red,
        orange: require('tailwindcss/colors').orange,
        green: require('tailwindcss/colors').green,
        yellow: require('tailwindcss/colors').yellow,
        blue: require('tailwindcss/colors').blue,
        pink: require('tailwindcss/colors').pink,
      },
    },
  },
  safelist: [
    // Ensure Tailwind generates classes for all colors
    { pattern: /bg-(purple|red|orange|green|yellow|blue|pink)-(600|700|300|200)/ },
    { pattern: /hover:bg-(purple|red|orange|green|yellow|blue|pink)-(600|700|300|200)/ },
  ],
  plugins: [],
};