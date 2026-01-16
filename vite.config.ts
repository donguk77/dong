import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load all env vars, including those not starting with VITE_
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Polyfill process.env.API_KEY for the frontend code
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Prevent crash if other process properties are accessed
      'process.env': {} 
    },
    build: {
      outDir: 'dist',
    }
  };
});