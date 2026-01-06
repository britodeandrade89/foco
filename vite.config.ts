import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Uso de '.' para evitar problemas com process.cwd em alguns ambientes
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY),
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      // Evita que o build falhe por erros de TypeScript (comum em deploys rápidos)
      commonjsOptions: {
        ignoreTryCatch: false,
      },
    },
    server: {
      port: 3000,
      host: true
    }
  };
});