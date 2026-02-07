import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: true,
    allowedHosts: ['local.resortwala.com'],
    proxy: {
      '/api': {
        target: 'http://gateway',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
