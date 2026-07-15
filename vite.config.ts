import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'production' ? '/lahja/' : '/',
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/test/**/*.test.ts']
  }
}));
