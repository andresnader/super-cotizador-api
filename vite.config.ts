import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// IMPORTANTE: Si la carpeta en tu servidor no se llama "cotizador", cambia la propiedad 'base' abajo.
export default defineConfig({
  plugins: [react()],
  base: '/cotizador/', 
})