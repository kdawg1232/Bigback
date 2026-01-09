/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        'brutalist-beige': '#F5F5DC',
        'brutalist-purple': '#663399',
        'brutalist-yellow': '#FFC72C',
        'brutalist-red': '#E21237',
      },
    },
  },
  plugins: [],
};
