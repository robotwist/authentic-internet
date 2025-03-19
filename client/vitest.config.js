import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.js'],
    include: [
      './src/tests/**/*.{test,spec}.{js,jsx}',
      './src/utils/__tests__/**/*.{test,spec}.{js,jsx}'
    ],
    exclude: [
      './src/tests/e2e/**/*.{test,spec}.{js,jsx}' // Exclude e2e tests that use Playwright
    ],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/tests/setup.js',
      ],
    },
  },
}); 