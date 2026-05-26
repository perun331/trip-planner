import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'production' ? '/trip-planner/' : '/',
  server: {
    host: true,
    proxy: {
      '/api/amap': {
        target: 'https://restapi.amap.com',
        changeOrigin: true,
        rewrite: (path) => {
          const newPath = path.replace('/api/amap', '')
          return newPath + (newPath.includes('?') ? '&' : '?') + 'key=f4847e12326126f7de7f75cc8a715db8'
        },
      },
    },
  },
}))
