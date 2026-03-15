import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/devices': 'http://backend:8000',
      '/connect': 'http://backend:8000',
    }
  }
})