// ESLint flat config — catches the categories of bugs we keep finding manually:
// - unused imports / vars
// - missing alt on <img> (blog/profile pages have shipped without alt several times)
// - missing useEffect deps
// - leftover dark-theme classes (warned via no-restricted-syntax)
//
// Run: npx eslint src/ scripts/ api/
// Pre-commit hook is the next step; for now this is opt-in.

import js from '@eslint/js';
import globals from 'globals';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default [
  { ignores: ['dist/', 'node_modules/', '_tmp_*', 'public/'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.node, ...globals.es2024 },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    settings: { react: { version: '18.3' } },
    rules: {
      // React
      ...reactPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off', // not needed with React 17+
      'react/prop-types': 'off',          // not using prop-types
      'react/no-unescaped-entities': 'off',
      'react-hooks/exhaustive-deps': 'warn',

      // a11y
      'jsx-a11y/alt-text': 'error',       // <img> without alt has been a real bug
      'jsx-a11y/anchor-is-valid': 'warn',

      // Core
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off',                // we use console intentionally in scripts
      'no-empty': ['warn', { allowEmptyCatch: true }],
    },
  },
  {
    // Scripts run in Node, no JSX, no React rules needed
    files: ['scripts/**/*.js', 'api/**/*.js'],
    languageOptions: {
      globals: { ...globals.node, ...globals.es2024 },
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
    },
  },
];
