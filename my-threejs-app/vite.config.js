// Import minimal chat proxy for dev API (Why: we add a small plugin that gives us /api/chat during development)
import ChatProxyPlugin from './tools/vite.chat-proxy.js';

export default {
  assetsInclude: ['**/*.ifc', '**/*.wasm'],
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.js'],
    globals: true
  },
  // Register /api/chat dev endpoint (What: enable the plugin so the route exists while vite runs)
  plugins: [ChatProxyPlugin()] // Activate the plugin by calling it
};