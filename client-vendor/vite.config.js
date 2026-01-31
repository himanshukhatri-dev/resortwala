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
    hmr: {
      host: 'local.resortwala.com',
      protocol: 'ws',
      // Port 8085 in error log implies some other service or config, ensuring 5174 is used or explicitly setting if needed. 
      // If the user is running on 8085 (as per log "ws://local.resortwala.com:8085"), we should match it or ensure the dev server port is actually 5174.
      // The error says "failed: ws://local.resortwala.com:8085". This suggests the client thinks HMR is on 8085. 
      // If this config says 5174, there is a mismatch. 
      // I will stick to what the user's error says if I can confirm where port 8085 comes from.
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
