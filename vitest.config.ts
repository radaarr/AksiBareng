import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Unit test murni (fungsi kuota, status, hash, format wei) — lapisan uji di docs/TESTING.md §1
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node'
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url))
    }
  }
})
