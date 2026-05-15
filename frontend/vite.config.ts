import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// https://vite.dev/config/
export default defineConfig({
  // Kök `.env` (TimeLink_Project/.env) — VITE_GOOGLE_CLIENT_ID veya GOOGLE_CLIENT_ID
  envDir: projectRoot,
  envPrefix: ['VITE_', 'GOOGLE_'],
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
})
