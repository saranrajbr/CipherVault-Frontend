import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
const apiProxy = {
  '/api': {
    target: 'http://127.0.0.1:8000',
    changeOrigin: true,
  },
}

export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    // Same-origin API calls in development, so the browser never needs a
    // cross-origin request. The backend still sends CORS headers for direct use.
    proxy: apiProxy,
  },
  preview: {
    port: 4173,
    // The same proxy for `vite preview`, so the production bundle can be
    // exercised locally against a running backend.
    proxy: apiProxy,
  },
})