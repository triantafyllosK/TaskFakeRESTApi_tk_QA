/**
 * JSON Schema for a single FakeRestAPI Book object.
 *
 * Types and nullability follow the published OpenAPI contract. publishDate is
 * validated as an ISO-8601-like date-time string. The timezone offset is
 * optional because FakeRestAPI sometimes returns .NET DateTime.MinValue as
 * "0001-01-01T00:00:00" without a zone.
 */
export const bookSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'title', 'description', 'pageCount', 'excerpt', 'publishDate'],
  properties: {
    id: { type: 'integer' },
    title: { type: ['string', 'null'] },
    description: { type: ['string', 'null'] },
    pageCount: { type: 'integer' },
    excerpt: { type: ['string', 'null'] },
    publishDate: { type: 'string', format: 'iso-date-time' },
  },
} as const;

/**
 * JSON Schema for GET /Books. The collection must be an array of Book objects
 * and must not be empty. Exact seeded size is not asserted here because that
 * would couple the contract to demo data volume.
 */
export const bookCollectionSchema = {
  type: 'array',
  minItems: 1,
  items: bookSchema,
} as const;
