import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    target: 'node18',
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        server: resolve(__dirname, 'server.ts')
      },
      output: {
        entryFileNames: '[name].js',
        format: 'es'
      },
      external: ['fsevents', 'fs', 'path', 'url', 'crypto']
    },
    minify: 'terser',
    sourcemap: false
  },
  esbuild: {
    target: 'node18'
  },
  ssr: {
    noExternal: []
  }
});
