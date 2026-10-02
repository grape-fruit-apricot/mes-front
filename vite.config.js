import { defineConfig, loadEnv } from 'vite';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxy = { '/api': { target: env.API_PROXY_TARGET || 'http://localhost:8080', changeOrigin: true } };
  return { server: { port: 5173, proxy }, preview: { port: 4173, proxy } };
});
