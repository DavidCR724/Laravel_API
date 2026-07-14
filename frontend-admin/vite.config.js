import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// El panel admin corre en su propio puerto (5174) para no chocar con el front
// de clientes (8000) ni con la API. El CORS de la API está abierto ('*').
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5174,
    strictPort: true,
  },
})
