import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// 开发期将 /api 代理到 NestJS 服务，保持同源语义（plan.md 6.1）
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
