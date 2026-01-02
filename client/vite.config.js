import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: {
    port: 5566,
    open: true,
    allowedHosts: [
      'ninjalive.clan.purecore.codes',
      'ninjalive.clan.suissai.dev',
      'localhost', '127.0.0.1', '0.0.0.0', '172.26.1.100']
  },
  preview: {
    port: 5566,
    open: true,
    allowedHosts: [
      'ninjalive.clan.purecore.codes',
      'ninjalive.clan.suissai.dev',
      'localhost', '127.0.0.1', '0.0.0.0', '172.26.1.100']
  }
});
