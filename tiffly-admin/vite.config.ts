import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // <-- THIS IS THE KEY FIX
    port: 5173, // Ensure it stays on 5173
  }
})
