import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const rawBackendUrl = env.VITE_BACKEND_API_URL || 'https://kurious-backend-api.centralus.cloudapp.azure.com'
  // Strip any path component — proxy target must be origin only (protocol + host + port)
  const backendUrl = new URL(rawBackendUrl).origin

  return {
    plugins: [react()],
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: false
        }
      }
    }
  }
})
