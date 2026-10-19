import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Two HTML entry points share one app bundle. The tool page gets its own static HTML so it has its
    // own title, description, and canonical URL, and is served from dist/tools/medical-bill-checker/index.html
    // on any static host without needing rewrite rules.
    rollupOptions: {
      input: {
        main: 'index.html',
        'medical-bill-checker': 'tools/medical-bill-checker/index.html',
      },
    },
  },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
})
