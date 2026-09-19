/**
 * In-memory record of an API call made through an API client.
 * Attachments are created only when a test fails so successful runs stay quiet.
 */
export interface ApiCallRecord {
  method: string;
  url: string;
  requestHeaders: Record<string, string>;
  requestBody?: unknown;
  status?: number;
  responseHeaders?: Record<string, string>;
  responseBody?: unknown;
}

/**
 * Header names that must never appear in CI logs or Allure attachments.
 * Comparison is case-insensitive.
 */
const SENSITIVE_HEADER_NAMES = new Set([
  'authorization',
  'proxy-authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
  'x-auth-token',
  'api-key',
  'token',
]);

export function redactHeaders(headers: Record<string, string>): Record<string, string> {
  const redacted: Record<string, string> = {};

  for (const [name, value] of Object.entries(headers)) {
    redacted[name] = SENSITIVE_HEADER_NAMES.has(name.toLowerCase()) ? '***REDACTED***' : value;
  }

  return redacted;
}

/**
 * Stores API calls for the current test. Tests never read this directly;
 * the Playwright fixture attaches the trail on failure.
 *
 * A list is kept (not only the last call) so workflow tests remain diagnosable
 * when an assertion fails after several HTTP interactions.
 */
export class ApiDiagnostics {
  private readonly calls: ApiCallRecord[] = [];

  record(call: ApiCallRecord): void {
    this.calls.push(call);
  }

  getCalls(): readonly ApiCallRecord[] {
    return this.calls;
  }
}
