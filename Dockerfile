# API-only Playwright image.
# Browser binaries are intentionally omitted: this suite uses APIRequestContext only.
FROM node:24-bookworm-slim

WORKDIR /app

# Prevent Playwright from downloading Chromium, Firefox, or WebKit during npm ci.
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Keep npm ci installing devDependencies. This image exists to run tests, not a production server.
ENV NPM_CONFIG_PRODUCTION=false

# Copy lockfiles first so dependency layers are reused when only source changes.
COPY package.json package-lock.json ./
RUN npm ci

# Copy the remaining project files after dependencies are installed.
COPY . .

# Tests run at container start. Allure static report generation is a CI concern,
# not a container concern. Do not start an Allure web server here.
CMD ["npx", "playwright", "test"]
