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
import { INT32_MAX, INT32_OVERFLOW, ROBUSTNESS_TITLES } from '../../utils/test-data';

test.describe('POST /api/v1/Books', () => {
  test(
    'POST /Books accepts a valid book payload and echoes the representation',
    { tag: ['@smoke', '@regression'] },
    async ({ booksClient }) => {
      // Isolate payload construction so Allure shows builder work separately from the HTTP call.
      const payload = await test.step('Build a valid book payload', async () => {
        return BookBuilder.validBook().withId(9_101).withPageCount(350).build();
      });

      const response = await test.step('Request POST /Books', async () => {
        return booksClient.createBook(payload);
      });

      const created = await test.step('Assert HTTP 200 JSON and Book contract', async () => {
        expect(response.status()).toBe(200);
        expectJsonContentType(response);
        return assertBookContract(await readJsonBody(response));
      });

      await test.step('Assert the response echoes the submitted representation', async () => {
        expect(created.id).toBe(payload['id']);
        expect(created.title).toBe(payload['title']);
        expect(created.pageCount).toBe(payload['pageCount']);
        expect(created.description).toBe(payload['description']);
      });
    },
  );

  test(
    'POST /Books accepts an empty title and returns it unchanged',
    { tag: ['@negative', '@regression'] },
    async ({ booksClient }) => {
      const payload = await test.step('Build a book payload with an empty title', async () => {
        return BookBuilder.validBook().withTitle('').build();
      });

      const response = await test.step('Request POST /Books', async () => {
        return booksClient.createBook(payload);
      });

      await test.step('Assert HTTP 200 and the empty title is echoed', async () => {
        expect(response.status()).toBe(200);
        const created = assertBookContract(await readJsonBody(response));
        expect(created.title).toBe('');
      });
    },
  );

  test(
    'POST /Books missing title is accepted and title becomes null',
    { tag: ['@negative', '@regression'] },
    async ({ booksClient }) => {
      const payload = await test.step('Build a book payload without a title field', async () => {
        return BookBuilder.validBook().without('title').build();
      });

      const response = await test.step('Request POST /Books', async () => {
        return booksClient.createBook(payload);
      });

      await test.step('Assert HTTP 200 and title defaults to null', async () => {
        expect(response.status()).toBe(200);
        const created = assertBookContract(await readJsonBody(response));
        expect(created.title).toBeNull();
      });
    },
  );

  test(
    'POST /Books accepts a null title',
    { tag: ['@negative', '@regression'] },
    async ({ booksClient }) => {
      const payload = await test.step('Build a book payload with a null title', async () => {
        return BookBuilder.validBook().withTitle(null).build();
      });

      const response = await test.step('Request POST /Books', async () => {
        return booksClient.createBook(payload);
      });

      await test.step('Assert HTTP 200 and the null title is echoed', async () => {
        expect(response.status()).toBe(200);
        const created = assertBookContract(await readJsonBody(response));
        expect(created.title).toBeNull();
      });
    },
  );

  test(
    'POST /Books accepts a negative pageCount',
    { tag: ['@negative', '@regression'] },
    async ({ booksClient }) => {
      const payload = await test.step('Build a book payload with pageCount -1', async () => {
        return BookBuilder.validBook().withPageCount(-1).build();
      });

      const response = await test.step('Request POST /Books', async () => {
        return booksClient.createBook(payload);
      });

      await test.step('Assert HTTP 200 and the negative pageCount is echoed', async () => {
        expect(response.status()).toBe(200);
        const created = assertBookContract(await readJsonBody(response));
        expect(created.pageCount).toBe(-1);
      });
    },
  );

  test(
    'POST /Books accepts a zero pageCount',
    { tag: ['@negative', '@regression'] },
    async ({ booksClient }) => {
      const payload = await test.step('Build a book payload with pageCount 0', async () => {
        return BookBuilder.validBook().withPageCount(0).build();
      });

      const response = await test.step('Request POST /Books', async () => {
        return booksClient.createBook(payload);
      });

      await test.step('Assert HTTP 200 and the zero pageCount is echoed', async () => {
        expect(response.status()).toBe(200);
        const created = assertBookContract(await readJsonBody(response));
        expect(created.pageCount).toBe(0);
      });
    },
  );

  test(
    'POST /Books accepts Int32.MaxValue pageCount and rejects Int32 overflow',
    { tag: ['@negative', '@regression'] },
    async ({ booksClient }) => {
      const maxPayload =
        await test.step('Build a payload with Int32.MaxValue pageCount', async () => {
          return BookBuilder.validBook().withPageCount(INT32_MAX).build();
        });

      const accepted =
        await test.step('Request POST /Books with Int32.MaxValue pageCount', async () => {
          return booksClient.createBook(maxPayload);
        });

      await test.step('Assert HTTP 200 and pageCount equals Int32.MaxValue', async () => {
        expect(accepted.status()).toBe(200);
        expect(assertBookContract(await readJsonBody(accepted)).pageCount).toBe(INT32_MAX);
      });

      const overflowPayload =
        await test.step('Build a payload with pageCount above Int32.MaxValue', async () => {
          return BookBuilder.validBook().withPageCount(INT32_OVERFLOW).build();
        });

      const rejected =
        await test.step('Request POST /Books with overflowing pageCount', async () => {
          return booksClient.createBook(overflowPayload);
        });

      await test.step('Assert HTTP 400 ProblemDetails for Int32 overflow', async () => {
        expect(rejected.status()).toBe(400);
        expectProblemContentType(rejected);
        assertProblemDetailsContract(await readJsonBody(rejected));
      });
    },
  );

  test(
    'POST /Books rejects an invalid publishDate with HTTP 400',
    { tag: ['@negative', '@regression'] },
    async ({ booksClient }) => {
      const payload = await test.step('Build a payload with an invalid publishDate', async () => {
        return BookBuilder.validBook().withPublishDate('invalid-date').build();
      });

      const response = await test.step('Request POST /Books', async () => {
        return booksClient.createBook(payload);
      });

      await test.step('Assert HTTP 400 ProblemDetails for invalid publishDate', async () => {
        expect(response.status()).toBe(400);
        expectProblemContentType(response);
        assertProblemDetailsContract(await readJsonBody(response));
      });
    },
  );

  test(
    'POST /Books accepts special characters and Unicode in title',
    { tag: ['@robustness', '@regression'] },
    async ({ booksClient }) => {
      const specialPayload =
        await test.step('Build a payload with special characters in the title', async () => {
          return BookBuilder.validBook().withTitle(ROBUSTNESS_TITLES.specialCharacters).build();
        });

      const special =
        await test.step('Request POST /Books with a special-character title', async () => {
          return booksClient.createBook(specialPayload);
        });

      await test.step('Assert HTTP 200 and the special-character title is echoed', async () => {
        expect(special.status()).toBe(200);
        expect(assertBookContract(await readJsonBody(special)).title).toBe(
          ROBUSTNESS_TITLES.specialCharacters,
        );
      });

      const unicodePayload = await test.step('Build a payload with a Unicode title', async () => {
        return BookBuilder.validBook().withTitle(ROBUSTNESS_TITLES.unicode).build();
      });

      const unicode = await test.step('Request POST /Books with a Unicode title', async () => {
        return booksClient.createBook(unicodePayload);
      });

      await test.step('Assert HTTP 200 and the Unicode title is echoed', async () => {
        expect(unicode.status()).toBe(200);
        expect(assertBookContract(await readJsonBody(unicode)).title).toBe(
          ROBUSTNESS_TITLES.unicode,
        );
      });
    },
  );

  test(
    'POST /Books accepts an unusually long title',
    { tag: ['@robustness', '@regression'] },
    async ({ booksClient }) => {
      const payload = await test.step('Build a payload with an unusually long title', async () => {
        return BookBuilder.validBook().withTitle(ROBUSTNESS_TITLES.long).build();
      });

      const response = await test.step('Request POST /Books', async () => {
        return booksClient.createBook(payload);
      });

      await test.step('Assert HTTP 200 and the long title is echoed', async () => {
        expect(response.status()).toBe(200);
        const created = assertBookContract(await readJsonBody(response));
        expect(created.title).toBe(ROBUSTNESS_TITLES.long);
      });
    },
  );

  test(
    'POST /Books ignores additional unexpected properties in the returned representation',
    { tag: ['@robustness', '@regression'] },
    async ({ booksClient }) => {
      const payload =
        await test.step('Build a payload that includes an unexpected extra property', async () => {
          return BookBuilder.validBook().withAdditionalProperty('unexpectedField', 'x').build();
        });

      const response = await test.step('Request POST /Books', async () => {
        return booksClient.createBook(payload);
      });

      await test.step('Assert HTTP 200 and the extra property is not echoed', async () => {
        expect(response.status()).toBe(200);
        const created = assertBookContract(await readJsonBody(response));
        expect(created).not.toHaveProperty('unexpectedField');
      });
    },
  );

  test(
    'POST /Books with an empty object uses .NET default values rather than HTTP 400',
    { tag: ['@negative', '@regression'] },
    async ({ booksClient }) => {
      const response = await test.step('Request POST /Books with an empty object', async () => {
        return booksClient.createBook({});
      });

      await test.step('Assert HTTP 200 and .NET default Book values', async () => {
        expect(response.status()).toBe(200);
        const created = assertBookContract(await readJsonBody(response));
        expect(created.id).toBe(0);
        expect(created.title).toBeNull();
        expect(created.pageCount).toBe(0);
        expect(created.publishDate).toContain('0001-01-01');
      });
    },
  );

  test(
    'POST /Books rejects a non-numeric pageCount with HTTP 400',
    { tag: ['@negative', '@robustness', '@regression'] },
    async ({ booksClient }) => {
      const payload = await test.step('Build a payload with a non-numeric pageCount', async () => {
        return BookBuilder.validBook().withPageCount('not-a-number').build();
      });

      const response = await test.step('Request POST /Books', async () => {
        return booksClient.createBook(payload);
      });

      await test.step('Assert HTTP 400 ProblemDetails for a non-numeric pageCount', async () => {
        expect(response.status()).toBe(400);
        expectProblemContentType(response);
        assertProblemDetailsContract(await readJsonBody(response));
      });
    },
  );

  test(
    'POST /Books rejects an incorrect Content-Type with HTTP 415',
    { tag: ['@robustness', '@regression'] },
    async ({ booksClient }) => {
      const payload = await test.step('Serialize a valid book as a raw JSON string', async () => {
        return JSON.stringify(BookBuilder.validBook().build());
      });

      const response =
        await test.step('Request POST /Books with Content-Type text/plain', async () => {
          return booksClient.createBookRaw(payload, { 'Content-Type': 'text/plain' });
        });

      await test.step('Assert HTTP 415 ProblemDetails for unsupported media type', async () => {
        expect(response.status()).toBe(415);
        expectProblemContentType(response);
        assertProblemDetailsContract(await readJsonBody(response));
      });
    },
  );

  test(
    'POST /Books rejects malformed JSON with HTTP 400',
    { tag: ['@robustness', '@regression'] },
    async ({ booksClient }) => {
      const response = await test.step('Request POST /Books with malformed JSON', async () => {
        return booksClient.createBookRaw('{not-json', {
          'Content-Type': 'application/json',
        });
      });

      await test.step('Assert HTTP 400 ProblemDetails for malformed JSON', async () => {
        expect(response.status()).toBe(400);
        expectProblemContentType(response);
        assertProblemDetailsContract(await readJsonBody(response));
      });
    },
  );

  test(
    'PATCH /Books/{id} is not an allowed method',
    { tag: ['@robustness', '@negative', '@regression'] },
    async ({ booksClient }) => {
      const response = await test.step('Request PATCH /Books/1', async () => {
        return booksClient.send('PATCH', '/api/v1/Books/1', {
          data: { title: 'patched' },
          headers: { 'Content-Type': 'application/json' },
        });
      });

      await test.step('Assert HTTP 405 Method Not Allowed', async () => {
        expect(response.status()).toBe(405);
      });
    },
  );
});
