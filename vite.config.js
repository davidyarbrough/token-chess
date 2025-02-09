// vite.config.js
export default {
  base: './',
  root: 'src',
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true
  },
  clearScreen: false
};
