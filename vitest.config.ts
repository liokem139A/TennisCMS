import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/test/**',
        '**/__tests__/**',
      ],
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
    include: ['src/**/*.test.ts', 'src/**/__tests__/**/*.test.ts'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@config': path.resolve(__dirname, './src/config'),
      '@controllers': path.resolve(__dirname, './src/controllers'),
      '@services': path.resolve(__dirname, './src/services'),
      '@middleware': path.resolve(__dirname, './src/middleware'),
      '@models': path.resolve(__dirname, './src/models'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
      '@db': path.resolve(__dirname, './db'),
    },
  },
});
