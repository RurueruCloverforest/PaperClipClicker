import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'trial',
    emptyOutDir: false,
    cssCodeSplit: false,
    lib: {
      entry: 'src/main.ts',
      name: 'PaperclipProtocol',
      formats: ['iife'],
      fileName: () => 'assets/game.js',
    },
    rollupOptions: {
      output: {
        assetFileNames: 'assets/game.css',
      },
    },
  },
});
