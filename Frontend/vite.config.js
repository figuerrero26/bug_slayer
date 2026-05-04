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
      '/api/auth': {
        target: process.env.AUTH_SERVICE_URL ?? 'http://localhost:8001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/auth/, ''),
      },
      '/api/dashboard': {
        target: process.env.DASHBOARD_SERVICE_URL ?? 'http://localhost:8002',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/dashboard/, ''),
      },
      '/api/search': {
        target: process.env.SEARCH_SERVICE_URL ?? 'http://localhost:8003',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/search/, ''),
      },
      '/api/notifications': {
        target: process.env.NOTIFICATIONS_SERVICE_URL ?? 'http://localhost:8004',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/notifications/, ''),
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor:  ['react', 'react-dom'],
          router:  ['react-router-dom'],
          motion:  ['framer-motion'],
        },
      },
    },
  },
})
