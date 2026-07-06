import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/d3') || id.includes('node_modules/d3-geo')) return 'd3'
          if (id.includes('node_modules/@supabase')) return 'supabase'
        },
      },
    },
  },
})
