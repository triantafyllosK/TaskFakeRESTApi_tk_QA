# TaskFakeRESTApi_tk_QA — API Automation Framework

Production-oriented API automation for the FakeRestAPI Bookstore `Books` resource. The repository is a small Software Engineer in Test project: reusable clients, typed models, runtime contract validation, failure diagnostics, Typescript+Playwright, Allure Report 3, JUnit CI results, GitHub Actions, and Docker.

## Project Overview

**API under test:** [FakeRestAPI](https://fakerestapi.azurewebsites.net)

**Primary scope:** Books endpoints

| Method | Path                 |
| ------ | -------------------- |
| GET    | `/api/v1/Books`      |
| GET    | `/api/v1/Books/{id}` |
| POST   | `/api/v1/Books`      |
| PUT    | `/api/v1/Books/{id}` |
| DELETE | `/api/v1/Books/{id}` |

Authors endpoints are intentionally out of scope until the Books solution stays complete and polished. The current architecture (config, fixtures, validator, diagnostics, reporting, CI, Docker) is ready to host an Authors client without a framework rewrite.

The suite contains a focused set of Books scenarios (positive, negative, boundary, contract, workflow, and input robustness). Quantity is not the goal. Each test documents a real, observed behavior.

## Why TypeScript + Playwright

Playwright is used here as an **API test platform**, not a browser automation tool.

- `APIRequestContext` is a capable HTTP client with isolated contexts, `baseURL`, and disposable fixtures.
- Playwright Test provides execution, fixtures, tags/`grep`, parallelism, retries, and first-class CI reporters.
- TypeScript `strict` mode keeps unvalidated API payloads as `unknown` until AJV (Another JSON Schema Validator library) narrows them to domain models.
- The same runner produces line output, JUnit XML, and Allure results without a custom harness.

This is API-only. There are no browsers, pages, locators, etc.

## Version Compatibility Decisions

Stable, verified compatibility is preferred over blindly selecting the newest package.

**TypeScript 5.9.3 is intentional.** TypeScript 7 is not used. typescript-eslint 8.70.0 is aligned with the TypeScript 5.9 tool chain. Switching to TypeScript 7 for recency would risk parser and type-aware lint incompatibility without improving the tests.

**Node.js 24 LTS is intentional.** Node Current (for example Node 26) is excluded so CI, Docker, and local runs stay on the LTS line.

**Allure Report 3 is intentional.** The `allure` npm package runs through Node.js. Java is not installed for reporting.

**Playwright 1.63.0 matches allure-playwright 3.12.1**, which requires `@playwright/test >= 1.62.0`.

## Architecture

Tests describe behavior. Clients describe HTTP. Models describe data. Schemas describe contracts. Builders describe test-data construction. Configuration describes environment. Diagnostics describe failures.

Dependency direction:

```
Tests → API Clients → Playwright APIRequestContext → FakeRestAPI
Tests → Models / Builders / Schemas / Validators / Config / Diagnostics
```

Supporting components do not depend on test files. There is no generic `BaseApiClient`, BaseTest, or DI container. `BooksClient.send()` exists only so CRUD methods and robustness cases (for example PATCH) share diagnostics.

## Test Strategy

| Category         | What it proves                                            | Example                                                                       |
| ---------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Positive         | Transport success and meaningful representation           | Valid GET/POST/PUT/DELETE                                                     |
| Negative         | Observed handling of invalid or unlikely input            | Negative `pageCount`, missing title, ID 0                                     |
| Boundary         | Limits of the published type system                       | Int32 max vs overflow, very large IDs                                         |
| Contract         | Runtime JSON Schema (AJV), separate from business asserts | Book object and collection schemas                                            |
| Workflow         | Multi-step HTTP flow without inventing persistence        | Create → update → delete representations                                      |
| Input robustness | Defensive API validation, not penetration testing         | Wrong Content-Type, malformed JSON, Unicode, long strings, unsupported method |

A successful test may assert three layers:

1. **Transport** — status and Content-Type
2. **Contract** — AJV schema
3. **Behavior** — returned ID equals requested ID, title echo, persistence absence

## Prerequisites

- Node.js 24 LTS
- npm
- Docker (optional, for containerized runs)

## Installation

```bash
npm ci
```

Use `npm ci` in CI, Docker, and local setup so the lockfile is the source of truth. Browser install is skipped via `.npmrc` (`playwright_skip_browser_download=1`).

Copy `.env.example` to `.env` for local convenience. Missing values fall back to the public FakeRestAPI, so a first clone can run without this file. Prefer an explicit `.env` or injected CI variables.

PowerShell:

```powershell
Copy-Item .env.example .env
```

CI must inject `BASE_URL` and `TEST_ENV` as environment variables. Never commit `.env`, credentials, or tokens.

## Running Tests

```bash
npm test
```

## Running Specific Suites

```bash
npm run test:smoke
npm run test:regression
npm run test:contract
npm run test:negative
npm run test:workflow
npm run test:robustness
```

Equivalent grep:

```bash
npx playwright test --grep "@smoke"
npx playwright test --grep "@regression"
npx playwright test --grep "@contract"
npx playwright test --grep "@negative"
npx playwright test --grep "@workflow"
npx playwright test --grep "@robustness"
```

Quality gates:

```bash
npm run lint
npm run typecheck
npm run format:check
```

## Environment Configuration

| Variable   | Purpose                       | Example                                 |
| ---------- | ----------------------------- | --------------------------------------- |
| `BASE_URL` | API origin, no trailing slash | `https://fakerestapi.azurewebsites.net` |
| `TEST_ENV` | Allure environment label only | `local`, `qa`, `staging`, `ci`, `docker` |

`TEST_ENV` is a report label. It does not change test logic. Docker examples use `docker`; CI injects `ci`.

Tests never hardcode the base URL. Changing environment does not require changing test source.

## Generate Allure Report

Allure Report 3 is a local npm dependency. Do not install a global Allure CLI. Do not install Java for reporting.

Use the npm script. It deletes the previous `allure-report/` directory and then generates a fresh report. Allure Report 3 has no Allure 2 `--clean` flag, so a leftover `index.html` can keep showing an old run if generate is invoked alone:

```bash
npm run report:generate
```

That script is equivalent to:

```bash
node scripts/clean-allure-report.mjs
npx allure generate allure-results --output allure-report
```

## Open Allure Report

```bash
npm run report:open
```

On failure, Allure includes an **API call diagnostics** attachment (method, URL, redacted headers, request body, status, response headers, response body). Successful tests do not dump payloads.

## CI reports and GitHub Pages

Pushes to main/master and nightly runs execute the full suite. Pull requests run
smoke and contract tests. Manual `workflow_dispatch` runs the selected suite:
`smoke`, `contract`, `regression`, or `full`. Only full runs on
the repository default branch can publish the shared Pages report.

The test job has read-only repository access and uploads `api-test-reports` for
10 days, including when tests fail and reporting succeeds. The separate publish
job has write access and serializes history restoration, report generation, and
the push to `gh-pages`. Its `allure-pages-snapshot` artifact includes the shared
history and final report. Failed tests remain a failed workflow even when their
report is published successfully.

An absent `gh-pages` branch is treated as the first publication. An existing
branch must contain a valid, nonempty Allure 3 `history.jsonl`; missing or corrupt
history and retrieval failures stop publication to preserve the current site.
If migrating an older branch without history, restore a valid history file before
running this workflow. Do not silently reset history to work around a fetch error.
The history retains up to 20 runs; old mixed-suite entries age out naturally.
Check the Pages deployment in Actions before checking the site.
Docker remains an optional local test runner; this workflow uses Node directly.

## Docker

This is an API-only image based on `node:24-bookworm-slim`. It does not install Chromium, Firefox, or WebKit and does not run `npx playwright install`.

Build:

```bash
docker build -t fakerestapi-books-tests .
```

Run tests and collect raw results (Linux / macOS):

```bash
docker run --rm \
  -e BASE_URL=https://fakerestapi.azurewebsites.net \
  -e TEST_ENV=docker \
  -v "$(pwd)/allure-results:/app/allure-results" \
  -v "$(pwd)/test-results:/app/test-results" \
  fakerestapi-books-tests
```

PowerShell:

```powershell
docker build -t fakerestapi-books-tests .
docker run --rm `
  -e BASE_URL=https://fakerestapi.azurewebsites.net `
  -e TEST_ENV=docker `
  -v "${PWD}/allure-results:/app/allure-results" `
  -v "${PWD}/test-results:/app/test-results" `
  fakerestapi-books-tests
```

The container runs tests only. Generate the Allure static report on the host or in CI:

```bash
npm run report:generate
```

Docker Compose is not used. There is no second service to orchestrate.
