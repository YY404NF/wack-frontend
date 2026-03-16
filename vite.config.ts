import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [vue()],
    server: {
      host: env.VITE_DEV_SERVER_HOST || '0.0.0.0',
      port: Number(env.VITE_DEV_SERVER_PORT || '5173'),
      proxy: {
        '/api': {
          target: env.VITE_DEV_API_PROXY_TARGET || 'http://127.0.0.1:8080',
          changeOrigin: true,
        },
      },
    },
  }
})
