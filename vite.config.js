import {resolve} from 'node:path';
import {defineConfig} from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      fileName: 'index',
      name: 'crunches',
    },
    sourcemap: true,
    target: 'esnext',
  },
});
