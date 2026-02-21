import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api/accounts': 'http://localhost:8081',
      '/api/transfers': 'http://localhost:8082',
      '/api/notifications': {
        target: 'http://localhost:8083',
        headers: { 'Accept': 'text/event-stream' },
      },
    },
  },
})
