import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

<<<<<<< HEAD
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 4000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
=======
// https://vitejs.dev/config/
// IMPORTANTE: Si la carpeta en tu servidor no se llama "cotizador", cambia la propiedad 'base' abajo.
export default defineConfig({
  plugins: [react()],
  base: '/cotizador/', 
})
>>>>>>> 7b1acce5b3bf139c54b3f0694a52a3715f24cecd
