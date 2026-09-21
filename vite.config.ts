import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      html2canvas: 'html2canvas-pro',
    },
  },
  server: {
    port: 5173,
    open: true,
  },
})
