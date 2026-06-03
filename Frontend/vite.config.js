import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' ws: wss:; frame-ancestors 'none'; object-src 'none';",
    },
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
      '/api/assistant': {
        target: process.env.ASSISTANT_SERVICE_URL ?? 'http://localhost:8006',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/assistant/, ''),
      },
    },
  },
  optimizeDeps: {
    exclude: ['html5-qrcode'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor:  ['react', 'react-dom'],
          router:  ['react-router-dom'],
          motion:  ['framer-motion'],
          icons:   ['react-icons', 'lucide-react'],
          qr:      ['qrcode.react'],
        },
      },
    },
  },
    test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  },
})
