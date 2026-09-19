import { expect, type APIResponse } from '@playwright/test';

/**
 * Transport-level assertions shared by tests. These check HTTP mechanics,
 * not business meaning. Tests still own the decision of which status and
 * which content type are expected for a given scenario.
 */
export function expectJsonContentType(response: APIResponse): void {
  const contentType = response.headers()['content-type'] ?? '';
  expect(contentType, 'Success payloads should advertise JSON').toMatch(/application\/json/i);
}

export function expectProblemContentType(response: APIResponse): void {
  const contentType = response.headers()['content-type'] ?? '';
  expect(contentType, 'Error payloads should advertise problem+json').toMatch(
    /application\/problem\+json/i,
  );
}

export async function readJsonBody(response: APIResponse): Promise<unknown> {
  return response.json() as Promise<unknown>;
}
