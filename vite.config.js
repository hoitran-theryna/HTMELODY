import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: true, // Listen on all network interfaces
    port: 3000,
    open: false, // Don't try to open browser on host from container
    strictPort: true // Fail if port 3000 is unavailable
  },
  build: {
    outDir: 'dist'
  }
});
