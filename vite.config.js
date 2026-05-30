import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Manual chunking: split heavy vendor libs into cacheable chunks so the
        // main bundle shrinks and repeat-visit caching works. The previous
        // 650KB main bundle was dragging PageSpeed scores.
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['framer-motion', 'lucide-react', 'sonner', 'cmdk'],
          'vendor-charts': ['recharts'],
          'vendor-markdown': ['react-markdown', 'remark-gfm'],
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },
});
