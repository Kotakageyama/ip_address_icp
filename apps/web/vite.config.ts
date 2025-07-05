import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';

// Read canister IDs from canister_ids.json
const getCanisterIds = () => {
  try {
    const canisterIdsPath = resolve(__dirname, '../../canister_ids.json');
    const canisterIdsJson = fs.readFileSync(canisterIdsPath, 'utf-8');
    return JSON.parse(canisterIdsJson);
  } catch (error) {
    console.warn('Could not read canister_ids.json:', error);
    return {};
  }
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';
  const canisterIds = getCanisterIds();

  // Check if we're using a local network (from .env file)
  const isLocalNetwork = process.env.VITE_IS_LOCAL_NETWORK === 'true';

  // Determine network
  const network = isLocalNetwork ? 'local' : isDev ? 'local' : 'ic';

  // Environment variables
  const envVars = {
    // Use canister ID from canister_ids.json if available, otherwise from .env
    VITE_CANISTER_ID_IP_ADDRESS_BACKEND:
      canisterIds?.ip_address_backend?.[network] ||
      process.env.VITE_CANISTER_ID_IP_ADDRESS_BACKEND,
    VITE_DFX_NETWORK: network,
    VITE_HOST:
      process.env.VITE_LOCAL_BACKEND_HOST ||
      (isDev ? 'http://127.0.0.1:4943' : 'https://icp0.io'),
    VITE_IS_LOCAL_NETWORK: isLocalNetwork ? 'true' : 'false',
  };

  console.log('Environment variables:', envVars);

  return {
    plugins: [react()],
    define: {
      // Inject environment variables at build time
      ...Object.entries(envVars).reduce(
        (acc, [key, value]) => {
          acc[`process.env.${key}`] = JSON.stringify(value);
          acc[`import.meta.env.${key}`] = JSON.stringify(value);
          return acc;
        },
        {} as Record<string, string>
      ),
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: isDev
        ? {
            '/api': {
              target:
                process.env.VITE_LOCAL_BACKEND_HOST || 'http://127.0.0.1:4943',
              changeOrigin: true,
            },
          }
        : undefined,
    },
    build: {
      outDir: 'dist',
      sourcemap: !isDev,
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        // Add alias for canister_ids.json
        'canister_ids.json': resolve(__dirname, '../../canister_ids.json'),
      },
    },
  };
});
