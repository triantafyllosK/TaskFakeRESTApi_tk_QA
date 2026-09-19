import Ajv, { type ErrorObject, type ValidateFunction } from 'ajv';
import type { Book } from '../models/book.model';
import { bookCollectionSchema, bookSchema } from '../schemas/book.schema';
import { problemDetailsSchema } from '../schemas/problem.schema';

/**
 * FakeRestAPI date-times appear in three observed shapes:
 * - 2026-09-18T13:05:33.117769+00:00 (offset)
 * - 2026-01-01T00:00:00Z (UTC Zulu)
 * - 0001-01-01T00:00:00 (.NET default, no offset)
 */
const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/;

const ajv = new Ajv({
  allErrors: true,
  strict: true,
  coerceTypes: false,
});

ajv.addFormat('iso-date-time', {
  type: 'string',
  validate: (value: string) => ISO_DATE_TIME.test(value),
});

const validators = new Map<object, ValidateFunction>();

function getValidator(schema: object): ValidateFunction {
  const cached = validators.get(schema);
  if (cached) {
    return cached;
  }

  const validator = ajv.compile(schema);
  validators.set(schema, validator);
  return validator;
}

function formatErrors(errors: ErrorObject[]): string {
  return errors
    .map((error) => {
      const location = error.instancePath === '' ? '/' : error.instancePath;
      const params = error.params ? ` ${JSON.stringify(error.params)}` : '';
      return `${location} ${error.message ?? 'is invalid'}${params}`;
    })
    .join('\n');
}

/**
 * Validate unknown API data against a JSON Schema and narrow it to T.
 * Contract failure is a test failure with a readable message — it is not
 * mixed into business assertions.
 */
export function assertSchema<T>(data: unknown, schema: object, schemaName: string): T {
  const validate = getValidator(schema);
  const valid = validate(data);

  if (!valid) {
    throw new Error(
      `${schemaName} contract validation failed:\n${formatErrors(validate.errors ?? [])}`,
    );
  }

  return data as T;
}

export function assertBookContract(data: unknown): Book {
  return assertSchema<Book>(data, bookSchema, 'Book');
}

export function assertBookCollectionContract(data: unknown): Book[] {
  return assertSchema<Book[]>(data, bookCollectionSchema, 'BookCollection');
}

export function assertProblemDetailsContract(data: unknown): Record<string, unknown> {
  return assertSchema<Record<string, unknown>>(data, problemDetailsSchema, 'ProblemDetails');
}
