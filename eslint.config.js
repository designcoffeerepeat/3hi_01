import js from '@eslint/js';
import globals from 'globals';

export default [
  // yellow/ is a separate Astro site with its own tooling.
  { ignores: ['dist/**', 'node_modules/**', 'yellow/**'] },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
];
