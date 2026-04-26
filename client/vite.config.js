import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  server: {
    port: 5556,
    host: true,
    open: true,
    watch: {
      usePolling: true,
    },
    hmr: {
      overlay: true,
    },
    allowedHosts: true
  },
  preview: {
    port: 5556,
    open: true,
    allowedHosts: true
  },
});
