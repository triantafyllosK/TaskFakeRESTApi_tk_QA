/**
 * Book domain model matching the FakeRestAPI OpenAPI Book schema.
 *
 * String fields are nullable in the published contract. Tests must not assume
 * a successful response always contains non-null titles or descriptions.
 */
export interface Book {
  id: number;
  title: string | null;
  description: string | null;
  pageCount: number;
  excerpt: string | null;
  publishDate: string;
}
