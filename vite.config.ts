import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig(({ mode }) => ({
  base: mode === 'capacitor' ? './' : '/',
  plugins: [react()],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      'figma:asset/9bed18162ddffb4f08f6a61f2064f8ab7ca8e96f.png':
        path.resolve(__dirname, './src/assets/9bed18162ddffb4f08f6a61f2064f8ab7ca8e96f.png'),
      'figma:asset/6c170266c53f89d8f1d3437fac31b268b5edfd7d.png':
        path.resolve(__dirname, './src/assets/6c170266c53f89d8f1d3437fac31b268b5edfd7d.png'),
      '@': path.resolve(__dirname, './src'),
    },
  },
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
  build: {
    target: 'esnext',
    outDir: 'build',
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/three/') ||
              id.includes('node_modules/@react-three/fiber') ||
              id.includes('node_modules/@react-three/drei') ||
              id.includes('node_modules/@react-three/postprocessing') ||
              id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/scheduler/')) return 'vendor-three';
          if (id.includes('node_modules/motion/') || id.includes('node_modules/framer-motion')) return 'vendor-motion';
          if (id.includes('node_modules/lenis/')) return 'vendor-lenis';
          if (id.includes('node_modules/lucide-react/')) return 'vendor-icons';
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
}));
