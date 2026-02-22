import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listen on all addresses
    port: 3000,
    strictPort: true,
    allowedHosts: [
      '.preview.emergentagent.com',
      '.preview.emergentcf.cloud',
    ],
    hmr: {
      clientPort: 443,
      protocol: 'wss',
    },
  },
  optimizeDeps: {
    include: ['lucide-react'],
  },
});
