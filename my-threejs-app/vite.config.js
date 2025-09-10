// vite.config.js
// Import minimal chat proxy for dev API
import ChatProxyPlugin from './vite.chat-proxy.js';

export default {
  assetsInclude: ['**/*.ifc', '**/*.wasm'],
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.js'],
    globals: true
  },
  // Register /api/chat dev endpoint
  plugins: [ChatProxyPlugin()]
};
