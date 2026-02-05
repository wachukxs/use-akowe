import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { FlatCompat } = require('@eslint/eslintrc');

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'react-hooks/exhaustive-deps': 'warn',
      'prefer-const': 'warn',
      'react/no-unescaped-entities': 'warn',
    },
  },
];

export default eslintConfig;
