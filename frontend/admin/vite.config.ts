import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      // 将 /api 的请求代理到后端 Spring Boot（修改为你的后端地址/端口）
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        // 去掉 /api 前缀，后端路由为 /admin/... 或 /api/... 视后端控制器映射而定
        // 例如前端请求 /api/admin/login -> 后端收到 /admin/login
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
