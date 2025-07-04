import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// Read canister IDs from canister_ids.json
const getCanisterIds = () => {
  try {
    const canisterIds = require('../../canister_ids.json')
    return canisterIds
  } catch (error) {
    console.warn('Could not read canister_ids.json:', error)
    return {}
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isDev = mode === 'development'
  const canisterIds = getCanisterIds()
  
  // Environment variables
  const envVars = {
    VITE_CANISTER_ID_IP_ADDRESS_BACKEND: 
      canisterIds?.ip_address_backend?.[isDev ? 'local' : 'ic'] || 
      process.env.VITE_CANISTER_ID_IP_ADDRESS_BACKEND,
    VITE_DFX_NETWORK: isDev ? 'local' : 'ic',
    VITE_HOST: isDev ? 'http://127.0.0.1:4943' : 'https://icp0.io',
  }

  return {
    plugins: [react()],
    define: {
      // Inject environment variables at build time
      ...Object.entries(envVars).reduce((acc, [key, value]) => {
        acc[`process.env.${key}`] = JSON.stringify(value)
        return acc
      }, {} as Record<string, string>),
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: isDev ? {
        '/api': {
          target: 'http://127.0.0.1:4943',
          changeOrigin: true,
        },
      } : undefined,
    },
    build: {
      outDir: 'dist',
      sourcemap: !isDev,
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
  }
})
