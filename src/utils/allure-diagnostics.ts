import { attachment, ContentType } from 'allure-js-commons';
import { type ApiDiagnostics, redactHeaders } from './api-diagnostics';

/**
 * Attach the API call trail to Allure when a test fails.
 *
 * The goal is unattended diagnosability: a reviewer should start investigation
 * from the CI report without reproducing the failure locally.
 *
 * Secrets are redacted before attachment. Successful tests do not attach
 * request/response payloads, which keeps reports readable.
 */
export async function attachApiDiagnosticsOnFailure(diagnostics: ApiDiagnostics): Promise<void> {
  const calls = diagnostics.getCalls();

  if (calls.length === 0) {
    await attachment(
      'API diagnostics',
      'No API call was recorded for this test.',
      ContentType.TEXT,
    );
    return;
  }

  const payload = calls.map((call) => ({
    method: call.method,
    url: call.url,
    requestHeaders: redactHeaders(call.requestHeaders),
    requestBody: call.requestBody ?? null,
    status: call.status ?? null,
    responseHeaders: call.responseHeaders ? redactHeaders(call.responseHeaders) : null,
    responseBody: call.responseBody ?? null,
  }));

  await attachment('API call diagnostics', JSON.stringify(payload, null, 2), ContentType.JSON);
}
