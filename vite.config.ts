import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: resolve(fileURLToPath(new URL('.', import.meta.url)), 'index.html')
    }
  },
  server: {
    port: 5173
  },
  root: '.',
  publicDir: 'public'
})
