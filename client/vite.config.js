import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import fs from "fs";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: true,
    chunkSizeWarningLimit: 1000, // Increase warning limit to 1MB
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Split vendor chunks
          if (id.includes("node_modules")) {
            // Keep Emotion together with MUI to prevent initialization issues
            if (id.includes("@emotion")) {
              return "mui-vendor";
            }
            // React and React DOM in separate chunk
            if (id.includes("react") || id.includes("react-dom")) {
              return "react-vendor";
            }
            // MUI libraries (including Emotion)
            if (id.includes("@mui")) {
              return "mui-vendor";
            }
            // Socket.io
            if (id.includes("socket.io")) {
              return "socket-vendor";
            }
            // Charts library
            if (id.includes("recharts")) {
              return "charts-vendor";
            }
            // PDF libraries
            if (id.includes("jspdf")) {
              return "pdf-vendor";
            }
            // Other node_modules
            return "vendor";
          }

          // Split large game components
          if (id.includes("GameWorld")) {
            return "gameworld";
          }
          if (
            id.includes("Level4Shooter") ||
            id.includes("TextAdventure") ||
            id.includes("Level3Terminal")
          ) {
            return "games";
          }
          if (id.includes("ArtifactGameLauncher") || id.includes("Artifact")) {
            return "artifacts";
          }
        },
        // Optimize chunk file names
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js",
        assetFileNames: "assets/[ext]/[name]-[hash].[ext]",
      },
    },
  },
  server: {
    hmr: {
      protocol: "ws",
      host: "localhost",
      // Let Vite auto-detect the port for HMR
      overlay: false, // Disable overlay to prevent intrusive error reporting
      timeout: 120000, // Increase HMR timeout to 120 seconds for more stability
    },
    host: "localhost",
    port: 5176, // Updated to 5176 to match current server
    strictPort: false, // Allow fallback to another port if in use
    cors: true,
    watch: {
      usePolling: true, // Enable polling for more reliable file watching
      interval: 1000, // Check every second
      binaryInterval: 3000, // Check binary files less frequently
    },
    proxy: {
      // Proxy API requests to the backend server
      "/api": {
        target: "http://localhost:5001", // Updated to match default server port
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, "/api"),
      },
    },
    // Auto-detect API availability
    fs: {
      strict: false, // Allow importing from outside of root directory
    },
    // Save client PID on startup
    configureServer(server) {
      server.httpServer?.once("listening", () => {
        try {
          fs.writeFileSync(".client_pid", process.pid.toString());
        } catch (err) {
          console.warn("⚠️ Could not save client PID:", err);
        }
      });
    },
  },
  // Ensure proper JSON handling
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@emotion/react",
      "@emotion/styled",
    ],
    force: false, // Don't force dependency pre-bundling every time
    esbuildOptions: {
      define: {
        global: "globalThis", // Fix issues with global references
      },
    },
  },
  // Handle cross-origin properly
  preview: {
    port: 5173,
    host: true,
    strictPort: false,
  },
});
