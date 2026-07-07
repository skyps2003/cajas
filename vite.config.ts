import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/peru': {
        target: 'https://api.apis.net.pe',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/peru/, '')
      },

      '/api': {
        target: 'https://caja.corporacionjjja.com',
        changeOrigin: true,
        secure: true,
      }
    }
  }
});
