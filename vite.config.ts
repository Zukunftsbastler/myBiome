import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';
import path from 'path';

// Workaround für __dirname in ES-Modulen
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, './src/core'),
      '@systems': path.resolve(__dirname, './src/systems'),
      '@data': path.resolve(__dirname, './src/data'),
      '@vis': path.resolve(__dirname, './src/vis'),
      '@ui': path.resolve(__dirname, './src/ui'),
      '@interaction': path.resolve(__dirname, './src/interaction')
    }
  },
  build: {
    target: 'esnext',
    minify: 'esbuild'
  }
});