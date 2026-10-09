import react from '@vitejs/plugin-react'
import { defineConfig, type ProxyOptions } from 'vite'

/**
 * The UI talks to the MockHub server through the `/api` prefix. Vite forwards those requests
 * (with the prefix removed) to the server, so the browser never makes cross-origin calls and the
 * server needs no CORS setup. Set MOCKHUB_API_URL when the server does not run on localhost:8083.
 */
const apiTarget = process.env.MOCKHUB_API_URL ?? 'http://localhost:8083'

const apiProxy: Record<string, ProxyOptions> = {
  '/api/': {
    target: apiTarget,
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, ''),
  },
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // `npm run build:embedded` builds the UI to be served by the MockHub server itself, under /ui/
  // (see FrontendController in the mockhub project and .env.embedded).
  base: mode === 'embedded' ? '/ui/' : '/',
  server: { port: 5173, proxy: apiProxy },
  preview: { port: 4173, proxy: apiProxy },
  // Mantine and React make up most of the ~200 kB (gzipped) bundle; acceptable for a developer tool.
  build: { chunkSizeWarningLimit: 800 },
}))
