import fs from 'node:fs';
import path from 'node:path';

/**
 * Playwright appends Allure result JSON into `allure-results/` and never
 * truncates that folder. A second local run would mix launches, so Allure
 * would show the previous spec plus the current one (or treat them as retries).
 *
 * Wipe the folder at the start of each Playwright process. Workers share this
 * globalSetup, so parallel tests in the same run still write into one launch.
 *
 * This does not delete Allure 3 history. Trends live in allure-history.jsonl
 * (allurerc.mjs historyPath), which CI restores from gh-pages after tests and
 * before `allure generate`.
 */
export default async function cleanAllureResults(): Promise<void> {
  const resultsDir = path.resolve('allure-results');
  fs.rmSync(resultsDir, { recursive: true, force: true });
}
