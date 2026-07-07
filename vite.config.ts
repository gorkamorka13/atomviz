import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react(), cloudflare()],
    define: {
      // Polyfill de process.env pour que le code existant fonctionne
      'process.env': JSON.stringify(env)
    }
  };
});