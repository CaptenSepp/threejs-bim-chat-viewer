// @ts-check
// Import Vite helper so local .env files are loaded for the dev server too.
import { defineConfig, loadEnv } from 'vite';
// Import path helpers so env files are loaded from this app folder, not from the terminal folder.
import { dirname } from 'node:path';
// Import url helper to convert the config file URL to a normal Windows path.
import { fileURLToPath } from 'node:url';
// Import minimal chat proxy for dev API (we add a small plugin that gives us /api/chat-assistant during development)
import ChatProxyPlugin from './tools/vite.chat-proxy.js';

// Resolve the real folder of this vite.config.js file.
const configDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  // Load .env.local and other Vite env files from the app folder.
  const localEnv = loadEnv(mode, configDir, '');
  // Copy env values so vite.chat-proxy.js can read process.env.GOOGLE_API_KEY.
  Object.assign(process.env, localEnv);

  return {
    assetsInclude: ['**/*.ifc', '**/*.wasm'],
    test: {
      environment: 'jsdom',
      include: ['tests/**/*.test.ts'],
      globals: true
    },
    // Register /api/chat dev endpoint (What: enable the plugin so the route exists while vite runs)
    plugins: [ChatProxyPlugin()] // Activate the plugin by calling it
  };
});
