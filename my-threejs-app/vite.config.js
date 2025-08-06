// vite.config.js
export default {
  assetsInclude: ['**/*.ifc', '**/*.wasm'],
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.js'],
    globals: true
  }
};
