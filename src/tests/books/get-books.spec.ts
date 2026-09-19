import { BookBuilder } from '../../api/builders/book.builder';
import {
  assertBookCollectionContract,
  assertBookContract,
} from '../../api/validators/schema.validator';
import { expect, test } from '../../fixtures/api.fixture';
import { expectJsonContentType, readJsonBody } from '../../utils/http-assertions';

test.describe('GET /api/v1/Books', () => {
  test(
    'GET /Books returns HTTP 200 JSON and a non-empty collection',
    { tag: ['@smoke', '@regression'] },
    async ({ booksClient }) => {
      const response = await test.step('Request GET /Books', async () => {
        return booksClient.getAllBooks();
      });

      await test.step('Assert HTTP 200 and JSON content type', async () => {
        expect(response.status(), 'Collection endpoint should succeed').toBe(200);
        expectJsonContentType(response);
      });

      await test.step('Assert the body is a non-empty JSON array', async () => {
        const body = await readJsonBody(response);
        expect(Array.isArray(body), 'Response body should be a JSON array').toBe(true);

        const books = body as unknown[];
        expect(books.length, 'Seeded collection should not be unexpectedly empty').toBeGreaterThan(
          0,
        );
      });
    },
  );

  test(
    'GET /Books representative items expose the required Book fields and types',
    { tag: ['@regression'] },
    async ({ booksClient }) => {
      const response = await test.step('Request GET /Books', async () => {
        return booksClient.getAllBooks();
      });

      await test.step('Assert HTTP 200', async () => {
        expect(response.status()).toBe(200);
      });

      const books =
        await test.step('Validate the collection against the Book contract', async () => {
          return assertBookCollectionContract(await readJsonBody(response));
        });

      await test.step('Assert first and last items expose required Book fields', async () => {
        const first = books[0];
        const last = books[books.length - 1];

        expect(first, 'First collection item should exist').toBeDefined();
        expect(last, 'Last collection item should exist').toBeDefined();

        for (const book of [first, last]) {
          const validated = assertBookContract(book);
          expect(typeof validated.id).toBe('number');
          expect(validated.pageCount).toEqual(expect.any(Number));
          expect(validated.publishDate.length).toBeGreaterThan(0);
        }
      });
    },
  );

  test(
    'GET /Books does not depend on a locally created book appearing in the collection',
    { tag: ['@regression'] },
    async ({ booksClient }) => {
      const uniqueTitle = `QA-Isolation-${crypto.randomUUID()}`;

      const payload = await test.step('Build a uniquely titled book payload', async () => {
        return BookBuilder.validBook().withId(9_001).withTitle(uniqueTitle).build();
      });

      await test.step('POST the book representation', async () => {
        const createResponse = await booksClient.createBook(payload);
        expect(createResponse.status()).toBe(200);
      });

      const books = await test.step('GET /Books after the local create', async () => {
        const listResponse = await booksClient.getAllBooks();
        expect(listResponse.status()).toBe(200);
        return assertBookCollectionContract(await readJsonBody(listResponse));
      });

      await test.step('Assert the created title is absent from the seeded collection', async () => {
        const createdAppearsInList = books.some((book) => book.title === uniqueTitle);

        expect(
          createdAppearsInList,
          'Observed FakeRestAPI limitation: POST does not persist into GET /Books',
        ).toBe(false);
      });
    },
  );
});
