import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { ApiDiagnostics } from '../../utils/api-diagnostics';

const BOOKS_PATH = '/api/v1/Books';

/**
 * Transport owner for the Books resource.
 *
 * This client knows HTTP methods, paths, and how to send requests through
 * Playwright's APIRequestContext. It does not own assertions. Tests decide
 * what a response means.
 *
 * Every call is recorded in ApiDiagnostics so failures can be investigated
 * from Allure without adding request logs to passing tests.
 */
export class BooksClient {
  constructor(
    private readonly request: APIRequestContext,
    private readonly diagnostics: ApiDiagnostics,
  ) {}

  getAllBooks(): Promise<APIResponse> {
    return this.send('GET', BOOKS_PATH);
  }

  getBookById(id: number | string): Promise<APIResponse> {
    return this.send('GET', `${BOOKS_PATH}/${id}`);
  }

  createBook(book: unknown): Promise<APIResponse> {
    return this.send('POST', BOOKS_PATH, {
      data: book,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Send a raw body so robustness tests can exercise malformed JSON and
   * incorrect Content-Type without dropping diagnostic recording.
   */
  createBookRaw(body: string, headers: Record<string, string>): Promise<APIResponse> {
    return this.send('POST', BOOKS_PATH, { data: body, headers });
  }

  updateBook(id: number | string, book: unknown): Promise<APIResponse> {
    return this.send('PUT', `${BOOKS_PATH}/${id}`, {
      data: book,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  deleteBook(id: number | string): Promise<APIResponse> {
    return this.send('DELETE', `${BOOKS_PATH}/${id}`);
  }

  /**
   * Low-level send used by CRUD (Create, Read, Update, Delete) methods and by robustness tests that need an
   * unsupported HTTP method (for example PATCH) while still recording diagnostics.
   */
  async send(
    method: string,
    url: string,
    options?: {
      data?: unknown;
      headers?: Record<string, string>;
    },
  ): Promise<APIResponse> {
    const response = await this.request.fetch(url, {
      method,
      data: options?.data,
      headers: options?.headers,
    });

    this.diagnostics.record({
      method,
      url: response.url(),
      requestHeaders: {
        Accept: 'application/json',
        ...options?.headers,
      },
      requestBody: options?.data,
      status: response.status(),
      responseHeaders: response.headers(),
      responseBody: await readResponseBody(response),
    });

    return response;
  }
}

/**
 * Playwright buffers APIResponse bodies, so reading here does not prevent
 * tests from calling response.json() or response.text() afterwards.
 */
async function readResponseBody(response: APIResponse): Promise<unknown> {
  const raw = await response.text();

  if (raw.length === 0) {
    return null;
  }

  const contentType = response.headers()['content-type'] ?? '';
  if (contentType.includes('json')) {
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      return raw;
    }
  }

  return raw;
}
