import {
  assertBookContract,
  assertProblemDetailsContract,
} from '../../api/validators/schema.validator';
import { expect, test } from '../../fixtures/api.fixture';
import {
  expectJsonContentType,
  expectProblemContentType,
  readJsonBody,
} from '../../utils/http-assertions';
import { BOUNDARY_BOOK_IDS, SEEDED_BOOK_IDS } from '../../utils/test-data';

test.describe('GET /api/v1/Books/{id}', () => {
  test(
    'GET /Books/{id} returns the requested book for a valid seeded ID',
    { tag: ['@smoke', '@regression'] },
    async ({ booksClient }) => {
      const requestedId = SEEDED_BOOK_IDS.first;

      const response = await test.step(`Request GET /Books/${requestedId}`, async () => {
        return booksClient.getBookById(requestedId);
      });

      const book = await test.step('Assert HTTP 200 JSON and Book contract', async () => {
        expect(response.status()).toBe(200);
        expectJsonContentType(response);

        const parsedBook = assertBookContract(await readJsonBody(response));
        expect(parsedBook.id, 'Returned ID must correspond to the requested ID').toBe(requestedId);
        return parsedBook;
      });

      await test.step('Assert seeded book payload fields', async () => {
        expect(book.title, 'Seeded books expose a title string').toEqual(expect.any(String));
        expect((book.title ?? '').length).toBeGreaterThan(0);
        expect(typeof book.pageCount).toBe('number');
      });
    },
  );

  test(
    'GET /Books/{id} returns another representative seeded book',
    { tag: ['@regression'] },
    async ({ booksClient }) => {
      const requestedId = SEEDED_BOOK_IDS.second;

      const response = await test.step(`Request GET /Books/${requestedId}`, async () => {
        return booksClient.getBookById(requestedId);
      });

      await test.step('Assert HTTP 200 JSON', async () => {
        expect(response.status()).toBe(200);
        expectJsonContentType(response);
      });

      await test.step('Assert the second seeded book matches the requested ID', async () => {
        const book = assertBookContract(await readJsonBody(response));
        expect(book.id).toBe(requestedId);
        expect(book.title, 'Second seeded book should also have a title').toEqual(
          expect.any(String),
        );
      });
    },
  );

  test(
    'GET /Books/{id} returns HTTP 404 for ID 0',
    { tag: ['@negative', '@regression'] },
    async ({ booksClient }) => {
      const requestedId = BOUNDARY_BOOK_IDS.zero;

      const response = await test.step(`Request GET /Books/${requestedId}`, async () => {
        return booksClient.getBookById(requestedId);
      });

      await test.step('Assert HTTP 404 ProblemDetails', async () => {
        expect(response.status()).toBe(404);
        expectProblemContentType(response);
      });

      await test.step('Assert problem status matches the HTTP status', async () => {
        const problem = assertProblemDetailsContract(await readJsonBody(response));
        expect(problem['status']).toBe(404);
      });
    },
  );

  test(
    'GET /Books/{id} returns HTTP 404 for a negative ID',
    { tag: ['@negative', '@regression'] },
    async ({ booksClient }) => {
      const requestedId = BOUNDARY_BOOK_IDS.negative;

      const response = await test.step(`Request GET /Books/${requestedId}`, async () => {
        return booksClient.getBookById(requestedId);
      });

      await test.step('Assert HTTP 404 ProblemDetails for a negative ID', async () => {
        expect(response.status()).toBe(404);
        expectProblemContentType(response);
        assertProblemDetailsContract(await readJsonBody(response));
      });
    },
  );

  test(
    'GET /Books/{id} returns HTTP 404 for a non-existing seeded ID',
    { tag: ['@negative', '@regression'] },
    async ({ booksClient }) => {
      const requestedId = BOUNDARY_BOOK_IDS.missingFromSeed;

      const response = await test.step(`Request GET /Books/${requestedId}`, async () => {
        return booksClient.getBookById(requestedId);
      });

      await test.step('Assert HTTP 404 ProblemDetails for an ID outside the seeded range', async () => {
        expect(response.status()).toBe(404);
        expectProblemContentType(response);
        assertProblemDetailsContract(await readJsonBody(response));
      });
    },
  );

  test(
    'GET /Books/{id} returns HTTP 404 for a very large ID that still fits Int32',
    { tag: ['@negative', '@regression'] },
    async ({ booksClient }) => {
      const requestedId = BOUNDARY_BOOK_IDS.veryLargeButInt32;

      const response = await test.step(`Request GET /Books/${requestedId}`, async () => {
        return booksClient.getBookById(requestedId);
      });

      await test.step('Assert HTTP 404 ProblemDetails for a large in-range Int32 ID', async () => {
        expect(response.status()).toBe(404);
        expectProblemContentType(response);
        assertProblemDetailsContract(await readJsonBody(response));
      });
    },
  );

  test(
    'GET /Books/{id} returns HTTP 400 for a non-numeric path value',
    { tag: ['@negative', '@robustness', '@regression'] },
    async ({ booksClient }) => {
      const requestedId = BOUNDARY_BOOK_IDS.nonNumeric;

      const response = await test.step(`Request GET /Books/${requestedId}`, async () => {
        return booksClient.getBookById(requestedId);
      });

      await test.step('Assert HTTP 400 ProblemDetails for a non-numeric path', async () => {
        expect(response.status()).toBe(400);
        expectProblemContentType(response);
        assertProblemDetailsContract(await readJsonBody(response));
      });
    },
  );

  test(
    'GET /Books/{id} returns HTTP 400 when the ID cannot bind to Int32',
    { tag: ['@negative', '@robustness', '@regression'] },
    async ({ booksClient }) => {
      const requestedId = BOUNDARY_BOOK_IDS.beyondInt32;

      const response = await test.step(`Request GET /Books/${requestedId}`, async () => {
        return booksClient.getBookById(requestedId);
      });

      await test.step('Assert HTTP 400 ProblemDetails when the ID overflows Int32', async () => {
        expect(response.status()).toBe(400);
        expectProblemContentType(response);
        assertProblemDetailsContract(await readJsonBody(response));
      });
    },
  );
});
