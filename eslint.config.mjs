import { FlatCompat } from '@eslint/eslintrc'

const ignores = {
  ignores: ['.next/', 'node_modules/', 'coverage/', 'playwright-report/', 'test-results/', 'contracts/artifacts/', 'next-env.d.ts']
}

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname
})

const config = [
  ignores,
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      // Setelah deploy kontrak, file generated di contracts/ tidak dilint
      'no-console': ['warn', { allow: ['warn', 'error'] }]
    }
  },
  {
    ignores: ['contracts/**']
  }
]

export default config
