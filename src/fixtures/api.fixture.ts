import { test as base } from '@playwright/test';
import { BooksClient } from '../api/clients/books.client';
import { ApiDiagnostics } from '../utils/api-diagnostics';
import { attachApiDiagnosticsOnFailure } from '../utils/allure-diagnostics';

/**
 * API-only Playwright fixture.
 *
 * Each test receives an isolated BooksClient bound to Playwright's request
 * context. Diagnostics are attached only when the test fails so Allure stays
 * useful in CI without flooding passing results.
 */
export const test = base.extend<{
  diagnostics: ApiDiagnostics;
  booksClient: BooksClient;
}>({
  diagnostics: async ({}, use) => {
    await use(new ApiDiagnostics());
  },

  booksClient: async ({ request, diagnostics }, use, testInfo) => {
    const client = new BooksClient(request, diagnostics);
    await use(client);

    if (testInfo.status !== testInfo.expectedStatus) {
      await attachApiDiagnosticsOnFailure(diagnostics);
    }
  },
});

export { expect } from '@playwright/test';
