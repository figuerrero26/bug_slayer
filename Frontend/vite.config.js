import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    watch: {
      usePolling: true,   // necesario para detectar cambios desde Windows hacia el contenedor
    },
    hmr: {
      host: 'localhost',
    },
    proxy: {
      '/api/search': {
        target: process.env.SEARCH_SERVICE_URL ?? 'http://localhost:8003',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/search/, ''),
      },
    },
  },
})
