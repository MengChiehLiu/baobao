import { defineConfig } from 'vite';

export default defineConfig({
  base: '/baobao/',
  build: { chunkSizeWarningLimit: 2000 },
});
