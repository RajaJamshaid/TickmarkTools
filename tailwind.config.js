/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#071B35', 800: '#0C2749', 700: '#12335C' },
        'teal-deep': '#146356',
        'cyan-brand': '#17B9F5',
        aqua: '#00D6C9',
        accent: '#4F46E5',
      },
      fontFamily: {
        heading: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 10px 30px -12px rgba(7,27,53,0.18)',
        glow: '0 20px 50px -20px rgba(23,185,245,0.55)',
      },
    },
  },
  plugins: [],
}
