import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// El front corre en http://localhost:8000 (origen permitido por el CORS de la API).
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 8000,
    strictPort: true,
  },
})
