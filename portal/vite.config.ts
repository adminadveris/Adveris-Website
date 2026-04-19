import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/portal/', // Ensures assets load correctly in subdirectories (GitHub Pages / Vercel)
  build: {
    outDir: '../portal-dist',
    emptyOutDir: true,
  }
})
