import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    target: 'node20',
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        server: resolve(__dirname, 'server.ts')
      },
      output: {
        entryFileNames: '[name].mjs',
        format: 'es'
      },
      external: ['fsevents', 'pkg']
    },
    minify: 'terser',
    sourcemap: false
  },
  esbuild: {
    target: 'node20'
  }
});
