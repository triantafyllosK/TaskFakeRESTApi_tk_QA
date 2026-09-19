import type { Book } from '../models/book.model';

/**
 * Immutable builder for Book request payloads.
 *
 * Valid data is generated per call (UUID-based titles) so tests stay independent
 * and parallel-friendly. Invalid data is equally first-class: negative tests
 * should use the same builder instead of scattering hardcoded payloads.
 *
 * build() returns a plain object rather than a validated Book. Runtime contract
 * validation happens on API responses, not on outgoing test data.
 */
export class BookBuilder {
  private constructor(private readonly payload: Record<string, unknown>) {}

  /**
   * Start from a domain-realistic book. Callers should override fields that
   * matter to the scenario and leave the rest unchanged.
   */
  static validBook(): BookBuilder {
    return new BookBuilder({
      id: 1,
      title: `QA-Book-${crypto.randomUUID()}`,
      description: 'Created by API automation. Not shared across tests.',
      pageCount: 120,
      excerpt: 'Short excerpt used by API automation.',
      publishDate: new Date().toISOString(),
    });
  }

  withId(id: number): BookBuilder {
    return new BookBuilder({ ...this.payload, id });
  }

  withTitle(title: string | null): BookBuilder {
    return new BookBuilder({ ...this.payload, title });
  }

  withDescription(description: string | null): BookBuilder {
    return new BookBuilder({ ...this.payload, description });
  }

  withPageCount(pageCount: number | string): BookBuilder {
    return new BookBuilder({ ...this.payload, pageCount });
  }

  withExcerpt(excerpt: string | null): BookBuilder {
    return new BookBuilder({ ...this.payload, excerpt });
  }

  withPublishDate(publishDate: string): BookBuilder {
    return new BookBuilder({ ...this.payload, publishDate });
  }

  /**
   * Drop a property entirely so missing-field behavior can be investigated.
   */
  without(field: keyof Book | string): BookBuilder {
    const next = { ...this.payload };
    delete next[field];
    return new BookBuilder(next);
  }

  /**
   * Add a property that is not part of the published Book contract.
   */
  withAdditionalProperty(name: string, value: unknown): BookBuilder {
    return new BookBuilder({ ...this.payload, [name]: value });
  }

  build(): Record<string, unknown> {
    return { ...this.payload };
  }
}
