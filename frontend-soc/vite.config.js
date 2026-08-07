import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/auth': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/simulate': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/metrics': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/dashboard': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/logs': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/alerts': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/remediations': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/threats': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/incidents': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/uba': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
});
