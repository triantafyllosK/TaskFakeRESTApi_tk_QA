import fs from 'node:fs';

const file = process.argv[2];
if (!file) throw new Error('Usage: node scripts/validate-allure-history.mjs <history.jsonl>');
const lines = fs.readFileSync(file, 'utf8').trim().split(/\r?\n/);
for (const [index, line] of lines.entries()) {
  const entry = JSON.parse(line);
  if (
    !entry ||
    typeof entry !== 'object' ||
    Array.isArray(entry) ||
    typeof entry.uuid !== 'string' ||
    !entry.uuid ||
    typeof entry.timestamp !== 'number' ||
    !entry.testResults ||
    typeof entry.testResults !== 'object' ||
    Array.isArray(entry.testResults)
  ) {
    throw new Error(`Invalid Allure history entry at line ${index + 1} in ${file}`);
  }
}
console.log(`Validated ${lines.length} Allure history entries.`);
