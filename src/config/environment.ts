import path from 'node:path';
import dotenv from 'dotenv';

/**
 * Load a local .env if present. This is a convenience for developers.
 * CI/CD should inject BASE_URL and TEST_ENV as real environment variables
 * and must not depend on a committed .env file.
 *
 * dotenv is loaded here (not in playwright.config.ts) because ES module / TS
 * imports are evaluated before later statements in the config file.
 */
dotenv.config({ path: path.resolve(process.cwd(), '.env'), quiet: true });

/**
 * Environment configuration for the API automation framework.
 *
 * Tests and clients must not hardcode BASE_URL. This module is the single
 * place that reads environment-specific settings so the same test code can
 * run against local, qa, staging, or CI by changing environment variables.
 */
export interface EnvironmentConfig {
  /**
   * FakeRestAPI origin without a trailing slash.
   * Example: https://fakerestapi.azurewebsites.net
   */
  readonly baseUrl: string;

  /**
   * Human-readable environment label used in Allure environment info.
   * This is not used for branching test logic.
   */
  readonly testEnv: string;
}

const DEFAULT_BASE_URL = 'https://fakerestapi.azurewebsites.net';
const DEFAULT_TEST_ENV = 'local';

/**
 * Load the active environment. Missing values fall back to the public demo API
 * so a first-time clone can run without extra setup. Callers should still
 * prefer explicit configuration via .env or CI variables.
 */
export function loadEnvironment(): EnvironmentConfig {
  const baseUrl = process.env.BASE_URL?.replace(/\/+$/, '') ?? DEFAULT_BASE_URL;
  const testEnv = process.env.TEST_ENV ?? DEFAULT_TEST_ENV;

  return {
    baseUrl,
    testEnv,
  };
}

export const environment = loadEnvironment();
