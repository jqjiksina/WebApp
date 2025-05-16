import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({mode})=>{
  const env = loadEnv(mode,process.cwd());

  return {
    mode: "development",
    plugins: [
      vue(),
      vueJsx(),
      vueDevTools(),
    ],
    server:{
      host: 'localhost',
      port: 5173,
      strictPort: true,
      headers: {
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Resource-Policy': 'cross-origin'
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      },
    },
    define:{

    },
    envPrefix: 'VITE'
  }
})
