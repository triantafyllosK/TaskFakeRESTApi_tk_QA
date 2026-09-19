/**
 * Stable identifiers and payload fragments derived from observed FakeRestAPI
 * behavior. These are not a shared mutable dataset — each constant is a
 * documented observation, not a value that tests modify.
 *
 * Seeded collection observation (GET /api/v1/Books): ids 1 through 200.
 */
export const SEEDED_BOOK_IDS = {
  first: 1,
  second: 2,
  last: 200,
} as const;

export const BOUNDARY_BOOK_IDS = {
  zero: 0,
  negative: -1,
  missingFromSeed: 201,
  veryLargeButInt32: 999_999,
  beyondInt32: '9999999999',
  nonNumeric: 'abc',
} as const;

/** .NET Int32.MaxValue. Observed as accepted for pageCount. */
export const INT32_MAX = 2_147_483_647;

/** One above Int32.MaxValue. Observed as HTTP 400 for pageCount. */
export const INT32_OVERFLOW = 2_147_483_648;

export const ROBUSTNESS_TITLES = {
  specialCharacters: 'Title with quotes & <tags> and backslash \\',
  unicode: 'Τίτλος Ελληνικός *_- café 📚',
  long: 'A'.repeat(5_000),
} as const;
