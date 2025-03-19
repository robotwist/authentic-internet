import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: undefined, // Prevents unnecessary module splitting
      },
    },
  },
  // Improve source map handling
  server: {
    hmr: {
      overlay: true
    }
  },
  // Ensure proper JSON handling
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
});

