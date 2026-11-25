import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Rutas relativas: la misma compilación sirve en un servidor y abierta como archivo (versión de escritorio).
  base: './',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      include: ['src/core/**'],
      exclude: ['src/core/**/*.test.ts', 'src/core/testing/**'],
    },
  },
})
