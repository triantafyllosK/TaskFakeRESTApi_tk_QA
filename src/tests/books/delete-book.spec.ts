import {
  assertBookContract,
  assertProblemDetailsContract,
} from '../../api/validators/schema.validator';
import { expect, test } from '../../fixtures/api.fixture';
import { expectJsonContentType, readJsonBody } from '../../utils/http-assertions';
import { BOUNDARY_BOOK_IDS, SEEDED_BOOK_IDS } from '../../utils/test-data';

test.describe('DELETE /api/v1/Books/{id}', () => {
  test(
    'DELETE /Books/{id} returns HTTP 200 with an empty body for a valid seeded ID',
    { tag: ['@smoke', '@regression'] },
    async ({ booksClient }) => {
      const requestedId = SEEDED_BOOK_IDS.first;

      const response = await test.step(`Request DELETE /Books/${requestedId}`, async () => {
        return booksClient.deleteBook(requestedId);
      });

      await test.step('Assert HTTP 200 with an empty body', async () => {
        expect(response.status()).toBe(200);
        expect(await response.text()).toBe('');
      });
    },
  );

  test(
    'DELETE /Books/{id} returns HTTP 200 for zero, negative, missing, and very large IDs',
    { tag: ['@negative', '@regression'] },
    async ({ booksClient }) => {
      // Each boundary ID is its own Allure step so a failure names the exact identifier.
      for (const id of [
        BOUNDARY_BOOK_IDS.zero,
        BOUNDARY_BOOK_IDS.negative,
        BOUNDARY_BOOK_IDS.missingFromSeed,
        BOUNDARY_BOOK_IDS.veryLargeButInt32,
      ]) {
        await test.step(`DELETE /Books/${id} returns HTTP 200 with an empty body`, async () => {
          const response = await booksClient.deleteBook(id);
          expect(response.status(), `DELETE with id ${id} should still return 200`).toBe(200);
          expect(await response.text()).toBe('');
        });
      }
    },
  );

  test(
    'DELETE /Books/{id} does not remove a seeded book from subsequent GET requests',
    { tag: ['@regression'] },
    async ({ booksClient }) => {
      const requestedId = SEEDED_BOOK_IDS.first;

      const before = await test.step(`GET /Books/${requestedId} before the delete`, async () => {
        const beforeResponse = await booksClient.getBookById(requestedId);
        expect(beforeResponse.status()).toBe(200);
        return assertBookContract(await readJsonBody(beforeResponse));
      });

      await test.step(`Request DELETE /Books/${requestedId}`, async () => {
        const deleteResponse = await booksClient.deleteBook(requestedId);
        expect(deleteResponse.status()).toBe(200);
      });

      await test.step(`GET /Books/${requestedId} after the delete and assert no persistence`, async () => {
        const afterResponse = await booksClient.getBookById(requestedId);
        expect(afterResponse.status()).toBe(200);
        expectJsonContentType(afterResponse);

        const after = assertBookContract(await readJsonBody(afterResponse));
        expect(after.id).toBe(requestedId);
        expect(after.title, 'Observed FakeRestAPI limitation: DELETE is not persisted').toBe(
          before.title,
        );
      });
    },
  );

  test(
    'DELETE /Books/{id} with a non-numeric path value returns HTTP 400',
    { tag: ['@negative', '@robustness', '@regression'] },
    async ({ booksClient }) => {
      const requestedId = BOUNDARY_BOOK_IDS.nonNumeric;

      const response = await test.step(`Request DELETE /Books/${requestedId}`, async () => {
        return booksClient.deleteBook(requestedId);
      });

      await test.step('Assert HTTP 400 ProblemDetails for a non-numeric path', async () => {
        expect(response.status()).toBe(400);
        const body = await readJsonBody(response);
        assertProblemDetailsContract(body);
      });
    },
  );
});
