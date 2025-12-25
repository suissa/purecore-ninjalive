import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: {
    port: 5555,
    open: true,
    allowedHosts: [
      'ninjameeting.purecore.codes',
      'ninjameeting.suissai.dev',
      'localhost', '127.0.0.1', '0.0.0.0', '172.26.1.100']
  }
});
