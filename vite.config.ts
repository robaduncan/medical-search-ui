import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Enable React Fast Refresh
      fastRefresh: true,
      // Include .tsx files for Fast Refresh
      include: '**/*.{jsx,tsx}',
    }),
  ],
  server: {
    port: 3000,
    host: true,
    // Enable hot module replacement
    hmr: {
      overlay: true,
    },
    // Watch for changes in additional file types
    watch: {
      usePolling: true,
      interval: 100,
    },
  },
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
