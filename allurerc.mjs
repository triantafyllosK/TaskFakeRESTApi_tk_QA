import { defineConfig } from 'allure';

/**
 * Allure Report 3 configuration.
 *
 * History is a JSONL file (one line per generate), not Allure 2's history/
 * folder. The path stays outside allure-report/ because
 * scripts/clean-allure-report.mjs deletes that directory before generate.
 *
 * CI restores this file from gh-pages before `npm run report:generate`, then
 * copies it into the published report so the next run can continue the trend.
 */
export default defineConfig({
  name: 'FakeRestAPI Books',
  output: './allure-report',
  historyPath: './allure-history.jsonl',
  appendHistory: true,
  historyLimit: 20,
});
