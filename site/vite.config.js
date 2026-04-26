import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: {
    port: 5555,
    host: true,
    open: true,
    allowedHosts: true,
    watch: {
      usePolling: true,
      interval: 100
    },
    hmr: {
      overlay: true
    }
  },
  preview: {
    port: 5555,
    open: true,
    allowedHosts: true
  }
});
