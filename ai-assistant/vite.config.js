import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // fileURLToPath 兼容所有 Node 版本，不依赖 import.meta.dirname（Node >= 20.11 才有）
      '@': resolve(fileURLToPath(new URL('.', import.meta.url)), 'src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
