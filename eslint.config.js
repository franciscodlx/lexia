const { defineConfig } = require('eslint/config')
const tseslint = require('typescript-eslint')
const react = require('eslint-plugin-react')
const reactHooks = require('eslint-plugin-react-hooks')

module.exports = defineConfig([
  {
    ignores: [
      'node_modules/**',
      'ios/**',
      'android/**',
      'supabase/functions/**',
      'lib/dict-*.ts',
    ],
  },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { react },
    settings: { react: { version: 'detect' } },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat['jsx-runtime'].rules,
      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'off',
    },
  },
  reactHooks.configs.flat['recommended-latest'] ?? reactHooks.configs.flat.recommended,
  {
    languageOptions: {
      globals: { __DEV__: 'readonly', console: 'readonly', process: 'readonly', require: 'readonly', module: 'writable', jest: 'readonly' },
    },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['*.config.js', 'jest.setup.ts', 'index.js', '__tests__/**', 'scripts/**'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  {
    files: ['scripts/**'],
    rules: { 'no-console': 'off' },
  },
])
