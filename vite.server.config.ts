import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    target: 'node16',
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        server: resolve(__dirname, 'server.ts')
      },
      output: {
        entryFileNames: '[name].js',
        format: 'cjs'
      }
    },
    minify: 'terser',
    sourcemap: false
  },
  esbuild: {
    target: 'node16'
  }
});
