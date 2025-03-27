import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import fs from 'fs'

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
  server: {
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
      overlay: false, // Disable overlay to prevent intrusive error reporting
      timeout: 60000 // Increase HMR timeout to 60 seconds for more stability
    },
    host: 'localhost',
    port: 5173,
    strictPort: false, // Allow fallback to another port if 5173 is in use
    cors: true,
    watch: {
      usePolling: false, // Disable polling to reduce CPU usage
      interval: 5000 // Increased to 5 seconds
    },
    proxy: {
      // Proxy API requests to the backend server
      '/api': {
        target: 'http://localhost:5001', // Updated to match default server port
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    },
    // Auto-detect API availability
    fs: {
      strict: false // Allow importing from outside of root directory
    },
    // Save client PID on startup
    configureServer(server) {
      server.httpServer?.once('listening', () => {
        try {
          fs.writeFileSync('.client_pid', process.pid.toString());
        } catch (err) {
          console.warn('⚠️ Could not save client PID:', err);
        }
      });
    }
  },
  // Ensure proper JSON handling
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    force: false // Don't force dependency pre-bundling every time
  },
  // Handle cross-origin properly
  preview: {
    port: 5173,
    host: true,
    strictPort: false
  }
});

