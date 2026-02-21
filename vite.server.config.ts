import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    target: 'node18',
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      input: {
        server: resolve(__dirname, 'server.ts')
      },
      output: {
        entryFileNames: '[name].mjs',
        format: 'es'
      },
      external: ['fsevents']
    }
  },
  esbuild: {
    target: 'node18'
  }
});
