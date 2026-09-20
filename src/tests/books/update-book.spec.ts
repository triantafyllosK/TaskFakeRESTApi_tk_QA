import { BookBuilder } from '../../api/builders/book.builder';
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

test.describe('PUT /api/v1/Books/{id}', () => {
  test(
    'PUT /Books/{id} echoes a valid updated representation',
    { tag: ['@smoke', '@regression'] },
    async ({ booksClient }) => {
      const requestedId = SEEDED_BOOK_IDS.first;

      // Isolate payload construction so Allure shows builder work separately from the HTTP call.
      const payload = await test.step('Build a valid updated book payload', async () => {
        return BookBuilder.validBook()
          .withId(requestedId)
          .withTitle(`QA-Updated-${crypto.randomUUID()}`)
          .withPageCount(250)
          .build();
      });

      const response = await test.step(`Request PUT /Books/${requestedId}`, async () => {
        return booksClient.updateBook(requestedId, payload);
      });

      const updated = await test.step('Assert HTTP 200 JSON and Book contract', async () => {
        expect(response.status()).toBe(200);
        expectJsonContentType(response);
        return assertBookContract(await readJsonBody(response));
      });

      await test.step('Assert the response echoes the submitted representation', async () => {
        expect(updated.id).toBe(payload['id']);
        expect(updated.title).toBe(payload['title']);
        expect(updated.pageCount).toBe(payload['pageCount']);
      });
    },
  );

  test(
    'PUT /Books/{id} with title-only payload fills remaining fields with .NET defaults',
    { tag: ['@negative', '@regression'] },
    async ({ booksClient }) => {
      const requestedId = SEEDED_BOOK_IDS.first;

      const response = await test.step(`Request PUT /Books/${requestedId} with title only`, async () => {
        return booksClient.updateBook(requestedId, {
          title: 'only-title',
        });
      });

      await test.step('Assert HTTP 200 and remaining fields use .NET defaults', async () => {
        expect(response.status()).toBe(200);
        const updated = assertBookContract(await readJsonBody(response));

        expect(updated.title).toBe('only-title');
        expect(updated.id).toBe(0);
        expect(updated.description).toBeNull();
        expect(updated.pageCount).toBe(0);
        expect(updated.excerpt).toBeNull();
        expect(updated.publishDate).toContain('0001-01-01');
      });
    },
  );

  test(
    'PUT /Books/{id} uses the body ID rather than the path ID in the returned representation',
    { tag: ['@regression'] },
    async ({ booksClient }) => {
      const pathId = 5;
      const bodyId = 99;

      const payload = await test.step('Build a payload whose ID differs from the path ID', async () => {
        return BookBuilder.validBook().withId(bodyId).withTitle('path-vs-body').build();
      });

      const response = await test.step(`Request PUT /Books/${pathId}`, async () => {
        return booksClient.updateBook(pathId, payload);
      });

      await test.step('Assert HTTP 200 and the echoed ID comes from the body', async () => {
        expect(response.status()).toBe(200);
        const updated = assertBookContract(await readJsonBody(response));
        expect(updated.id).toBe(bodyId);
        expect(updated.title).toBe('path-vs-body');
      });
    },
  );

  test(
    'PUT /Books/{id} returns HTTP 200 for zero, negative, and non-existing IDs',
    { tag: ['@negative', '@regression'] },
    async ({ booksClient }) => {
      // Each boundary ID is its own Allure step so a failure names the exact identifier.
      for (const id of [
        BOUNDARY_BOOK_IDS.zero,
        BOUNDARY_BOOK_IDS.negative,
        BOUNDARY_BOOK_IDS.missingFromSeed,
        BOUNDARY_BOOK_IDS.veryLargeButInt32,
      ]) {
        await test.step(`PUT /Books/${id} echoes the payload with HTTP 200`, async () => {
          const payload = BookBuilder.validBook().withId(id).withTitle(`QA-Put-${id}`).build();
          const response = await booksClient.updateBook(id, payload);

          expect(response.status(), `PUT with id ${id} should echo the payload`).toBe(200);
          const updated = assertBookContract(await readJsonBody(response));
          expect(updated.id).toBe(id);
        });
      }
    },
  );

  test(
    'PUT /Books/{id} accepts a negative pageCount',
    { tag: ['@negative', '@regression'] },
    async ({ booksClient }) => {
      const requestedId = SEEDED_BOOK_IDS.first;

      const payload = await test.step('Build a payload with pageCount -5', async () => {
        return BookBuilder.validBook().withId(requestedId).withPageCount(-5).build();
      });

      const response = await test.step(`Request PUT /Books/${requestedId}`, async () => {
        return booksClient.updateBook(requestedId, payload);
      });

      await test.step('Assert HTTP 200 and the negative pageCount is echoed', async () => {
        expect(response.status()).toBe(200);
        expect(assertBookContract(await readJsonBody(response)).pageCount).toBe(-5);
      });
    },
  );

  test(
    'PUT /Books/{id} rejects an invalid publishDate with HTTP 400',
    { tag: ['@negative', '@regression'] },
    async ({ booksClient }) => {
      const requestedId = SEEDED_BOOK_IDS.first;

      const payload = await test.step('Build a payload with an invalid publishDate', async () => {
        return BookBuilder.validBook().withId(requestedId).withPublishDate('invalid-date').build();
      });

      const response = await test.step(`Request PUT /Books/${requestedId}`, async () => {
        return booksClient.updateBook(requestedId, payload);
      });

      await test.step('Assert HTTP 400 ProblemDetails for invalid publishDate', async () => {
        expect(response.status()).toBe(400);
        expectProblemContentType(response);
        assertProblemDetailsContract(await readJsonBody(response));
      });
    },
  );

  test(
    'PUT /Books/{id} does not persist the update into GET /Books/{id}',
    { tag: ['@regression'] },
    async ({ booksClient }) => {
      const requestedId = SEEDED_BOOK_IDS.first;

      const before = await test.step(`GET /Books/${requestedId} before the update`, async () => {
        const beforeResponse = await booksClient.getBookById(requestedId);
        expect(beforeResponse.status()).toBe(200);
        return assertBookContract(await readJsonBody(beforeResponse));
      });

      const uniqueTitle = `QA-Put-NoPersist-${crypto.randomUUID()}`;
      const payload = await test.step('Build an updated payload with a unique title', async () => {
        return BookBuilder.validBook().withId(requestedId).withTitle(uniqueTitle).build();
      });

      await test.step(`Request PUT /Books/${requestedId}`, async () => {
        const putResponse = await booksClient.updateBook(requestedId, payload);
        expect(putResponse.status()).toBe(200);
        expect(assertBookContract(await readJsonBody(putResponse)).title).toBe(uniqueTitle);
      });

      await test.step(`GET /Books/${requestedId} after the update and assert no persistence`, async () => {
        const afterResponse = await booksClient.getBookById(requestedId);
        expect(afterResponse.status()).toBe(200);
        const after = assertBookContract(await readJsonBody(afterResponse));
        expect(after.title, 'Observed FakeRestAPI limitation: PUT is not persisted').toBe(
          before.title,
        );
      });
    },
  );
});
