/**
 * RFC 7807-style problem details as returned by FakeRestAPI for many 4xx
 * responses (application/problem+json). Used to contract-check error bodies
 * without treating every 4xx as an unexpected failure.
 */
export const problemDetailsSchema = {
  type: 'object',
  additionalProperties: true,
  required: ['status', 'title'],
  properties: {
    type: { type: 'string' },
    title: { type: 'string' },
    status: { type: 'integer' },
    traceId: { type: 'string' },
    errors: { type: 'object' },
  },
} as const;
