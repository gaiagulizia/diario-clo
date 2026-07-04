import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/diario-clo/', // nome del repo GitHub - necessario per GitHub Pages
  build: {
    outDir: 'dist',
  },
})
