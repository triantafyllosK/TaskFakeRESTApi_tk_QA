import tseslint from 'typescript-eslint';

/**
 * Flat ESLint config focused on correctness and TypeScript quality.
 * Formatting belongs to Prettier, so stylistic overlap is intentionally avoided.
 */
export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'allure-results/**',
      'allure-report/**',
      'test-results/**',
      'playwright-report/**',
      'scripts/**',
    ],
  },
  tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
);
