import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: './', // frontend root
  server: {
    port: 5173, // frontend dev port
    strictPort: true
  },
  build: {
    outDir: 'dist'
  }
});
