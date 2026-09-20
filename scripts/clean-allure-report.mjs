/**
 * Allure 3 `generate` has no `--clean` flag (Allure 2 did).
 * If `allure-report/` already exists, generate leaves the previous `index.html`
 * in place. An open Allure tab then keeps showing the old run even though
 * `allure-results/` has newer payloads.
 *
 * This script deletes only the generated HTML. It never deletes `allure-results`
 * because that directory is the input of `allure generate`. It also never
 * deletes `allure-history.jsonl` (Allure 3 historyPath in allurerc.mjs), which
 * lives next to the report and must survive this wipe so generate can append.
 */
import fs from 'node:fs';
import path from 'node:path';

const reportDir = path.resolve('allure-report');
fs.rmSync(reportDir, { recursive: true, force: true });
