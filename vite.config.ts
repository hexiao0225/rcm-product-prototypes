import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Served from https://<user>.github.io/rcm-product-prototypes/
export default defineConfig({
  base: '/rcm-product-prototypes/',
  plugins: [react()],
})
