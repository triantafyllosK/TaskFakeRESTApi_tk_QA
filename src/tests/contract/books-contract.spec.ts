import {
  assertBookCollectionContract,
  assertBookContract,
} from '../../api/validators/schema.validator';
import { expect, test } from '../../fixtures/api.fixture';
import { expectJsonContentType, readJsonBody } from '../../utils/http-assertions';
import { SEEDED_BOOK_IDS } from '../../utils/test-data';

test.describe('Books API contracts', () => {
  test(
    'GET /Books collection satisfies the Book array contract',
    { tag: ['@contract', '@regression'] },
    async ({ booksClient }) => {
      const response = await test.step('Request GET /Books', async () => {
        return booksClient.getAllBooks();
      });

      await test.step('Assert HTTP 200 JSON', async () => {
        expect(response.status()).toBe(200);
        expectJsonContentType(response);
      });

      await test.step('Validate the collection against the Book array contract', async () => {
        assertBookCollectionContract(await readJsonBody(response));
      });
    },
  );

  test(
    'GET /Books/{id} response satisfies the Book object contract',
    { tag: ['@contract', '@smoke', '@regression'] },
    async ({ booksClient }) => {
      const requestedId = SEEDED_BOOK_IDS.first;

      const response = await test.step(`Request GET /Books/${requestedId}`, async () => {
        return booksClient.getBookById(requestedId);
      });

      await test.step('Assert HTTP 200 JSON', async () => {
        expect(response.status()).toBe(200);
        expectJsonContentType(response);
      });

      await test.step('Validate the body against the Book object contract', async () => {
        const book = assertBookContract(await readJsonBody(response));
        expect(book.id).toBe(requestedId);
      });
    },
  );

  test(
    'GET /Books/{id} last seeded item also satisfies the Book contract',
    { tag: ['@contract', '@regression'] },
    async ({ booksClient }) => {
      const requestedId = SEEDED_BOOK_IDS.last;

      const response = await test.step(`Request GET /Books/${requestedId}`, async () => {
        return booksClient.getBookById(requestedId);
      });

      await test.step('Assert HTTP 200 and Book contract for the last seeded ID', async () => {
        expect(response.status()).toBe(200);
        const book = assertBookContract(await readJsonBody(response));
        expect(book.id).toBe(requestedId);
      });
    },
  );
});
