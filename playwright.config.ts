import { defineConfig } from '@playwright/test';
import { environment } from './src/config/environment';

/**
 * API-only Playwright configuration.
 *
 * Browsers, screenshots, traces, and UI projects are intentionally omitted.
 * This suite uses APIRequestContext exclusively.
 */
export default defineConfig({
  testDir: './src/tests',
  // See src/setup/clean-allure-results.ts for CI / history constraints.
  globalSetup: './src/setup/clean-allure-results.ts',
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Retries are disabled by default so flakes and real API defects stay visible.
  retries: 0,
  // Keep concurrency modest against the public demo API.
  workers: 2,
  reporter: [
    ['line'],
    [
      'allure-playwright',
      {
        resultsDir: 'allure-results',
        detail: true,
        suiteTitle: true,
        environmentInfo: {
          node_version: process.version,
          environment: process.env.TEST_ENV ?? environment.testEnv,
          base_url: process.env.BASE_URL ?? environment.baseUrl,
        },
        globalLabels: {
          layer: 'api',
        },
      },
    ],
    [
      'junit',
      {
        outputFile: 'test-results/junit-results.xml',
      },
    ],
  ],
  use: {
    baseURL: environment.baseUrl,
    extraHTTPHeaders: {
      Accept: 'application/json',
    },
  },
});
