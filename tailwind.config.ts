import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Marcel Gladbach Brand Colors
        'mga-cream': '#FAF9F7',
        'mga-black': '#1a1a1a',
        'mga-sage': '#5A614B',
        'mga-gray': {
          light: '#f5f5f5',
          DEFAULT: '#e5e5e5',
          dark: '#666666'
        }
      },
      fontFamily: {
        'haas': ['neue-haas-grotesk-display', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'mga-xl': ['56px', '1.2'],
        'mga-lg': ['40px', '1.2'],
        'mga-md': ['24px', '1.5'],
        'mga-sm': ['16px', '1.6'],
        'mga-xs': ['14px', '1.7'],
      },
      spacing: {
        'mga-1': '8px',
        'mga-2': '16px',
        'mga-3': '24px',
        'mga-4': '32px',
        'mga-5': '40px',
        'mga-6': '48px',
        'mga-7': '56px',
        'mga-8': '64px',
      },
    },
  },
  plugins: [],
};
export default config;