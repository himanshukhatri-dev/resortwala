import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

// https://vite.dev/config/
export default defineConfig({
  base: '/vendor/',
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer,
      ],
    },
  },
  server: {
    port: 5174,
    host: true,
    allowedHosts: ['local.resortwala.com', 'localhost'], // Added localhost
    watch: {
      usePolling: true,
    },
    hmr: {
      host: 'local.resortwala.com',
      protocol: 'ws',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8085',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
