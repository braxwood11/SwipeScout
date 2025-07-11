import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => {
  const isProduction = command === 'build'
  
  return {
    plugins: [react()],
    base: isProduction ? '/swipescout/' : '/',  // Only use subpath in production
    build: {
      outDir: '../static/swipescout'
    }
  }
})