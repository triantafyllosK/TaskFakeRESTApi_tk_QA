import { BookBuilder } from '../../api/builders/book.builder';
import { assertBookContract } from '../../api/validators/schema.validator';
import { expect, test } from '../../fixtures/api.fixture';
import { expectJsonContentType, readJsonBody } from '../../utils/http-assertions';

test.describe('Books business workflow', () => {
  test(
    'Create, update, and delete return coherent HTTP representations without assuming persistence',
    { tag: ['@workflow', '@regression'] },
    async ({ booksClient }) => {
      const createdTitle = `QA-Lifecycle-${crypto.randomUUID()}`;
      const updatedTitle = `${createdTitle}-updated`;

      // Isolate payload construction so Allure shows builder work separately from the HTTP call.
      const createPayload = await test.step('Build a unique create payload', async () => {
        return BookBuilder.validBook()
          .withId(9_501)
          .withTitle(createdTitle)
          .withPageCount(180)
          .build();
      });

      const created =
        await test.step('POST /Books and assert the echoed representation', async () => {
          const createResponse = await booksClient.createBook(createPayload);
          expect(createResponse.status()).toBe(200);
          expectJsonContentType(createResponse);

          const createdBook = assertBookContract(await readJsonBody(createResponse));
          expect(createdBook.title).toBe(createdTitle);
          expect(createdBook.pageCount).toBe(180);
          return createdBook;
        });

      await test.step('GET /Books/{id} after create and assert the ID is not persisted', async () => {
        const getAfterCreate = await booksClient.getBookById(created.id);
        expect(
          getAfterCreate.status(),
          'FakeRestAPI does not persist POST; GET of the created ID is 404',
        ).toBe(404);
      });

      const updatePayload =
        await test.step('Build an updated representation for the created ID', async () => {
          return BookBuilder.validBook()
            .withId(created.id)
            .withTitle(updatedTitle)
            .withPageCount(220)
            .build();
        });

      await test.step('PUT /Books/{id} and assert the echoed updated representation', async () => {
        const updateResponse = await booksClient.updateBook(created.id, updatePayload);
        expect(updateResponse.status()).toBe(200);

        const updated = assertBookContract(await readJsonBody(updateResponse));
        expect(updated.title).toBe(updatedTitle);
        expect(updated.pageCount).toBe(220);
      });

      await test.step('DELETE /Books/{id} and assert HTTP 200', async () => {
        const deleteResponse = await booksClient.deleteBook(created.id);
        expect(deleteResponse.status()).toBe(200);
      });

      await test.step('GET /Books/{id} after delete and assert lack of persistence', async () => {
        const getAfterDelete = await booksClient.getBookById(created.id);
        expect(getAfterDelete.status()).toBe(404);
      });
    },
  );
});
