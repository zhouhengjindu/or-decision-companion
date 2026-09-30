import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  // Both responsive projects intentionally exercise the same local D1 database.
  // Serial workers keep each journey isolated from another project's cleanup.
  workers: 1,
  retries: 0,
  reporter: process.env.EVALUATION
    ? [['line'], ['json', { outputFile: 'evaluation/e2e-results.json' }]]
    : 'line',
  use: { baseURL: 'http://localhost:3000', trace: 'retain-on-failure', channel: 'chrome' },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'pnpm dev', url: 'http://localhost:3000', reuseExistingServer: true, timeout: 120_000,
  },
});
