import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    headless: true,
  },
});