import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Leer la configuración para decidir si usar proxy local
// Esta debe coincidir con USE_LOCAL_BACKEND en config.ts
const USE_LOCAL_BACKEND = false; // Cambiar a false cuando uses Railway

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Proxy automático para desarrollo local
  server: USE_LOCAL_BACKEND ? {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  } : undefined,
})
