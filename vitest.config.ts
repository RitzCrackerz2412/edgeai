import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/lib/engine/**/*.ts',
        'src/lib/features/**/*.ts',
      ],
      exclude: [
        'src/lib/engine/__tests__/**',
        'src/lib/features/__tests__/**',
      ],
      thresholds: {
        lines:     90,
        functions: 90,
        branches:  85,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
