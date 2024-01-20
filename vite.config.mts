import { splitVendorChunkPlugin } from 'vite';
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'
import eslintPlugin from 'vite-plugin-eslint'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    chunkSizeWarningLimit: 10240000,
    rollupOptions: {
      output: {
        // https://dev.to/tassiofront/splitting-vendor-chunk-with-vite-and-loading-them-async-15o3
        manualChunks(id: string) {
          const vendors = ['onnxruntime', 'react', 'opencv']
          for(const vendor of vendors) {
            if (id.includes(vendor)) {
              return `${vendor}-runtime`;
            }
          }
        },
      }
    }
  },
  base: './',
  plugins: [
    splitVendorChunkPlugin(),
    react(),
    eslintPlugin(),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/onnxruntime-web/dist/*.wasm',
          dest: './',
        },
      ],
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    css: true,
    reporters: ['verbose'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*'],
      exclude: [],
    },
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
})
