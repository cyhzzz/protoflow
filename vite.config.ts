import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/protoflow/',  // GitHub Pages需要这个配置
  server: {
    port: 3000,
    open: true
  }
})
