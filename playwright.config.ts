import { defineConfig, devices } from '@playwright/test'

// E2E untuk alur demo (docs/TESTING.md §1). Jalankan: pnpm test:e2e
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  // Test memakai satu database demo; jalankan berurutan agar mutasi seed tidak saling menimpa.
  workers: 1,
  use: {
    baseURL: 'http://localhost:3000',
    locale: 'id-ID'
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
  ]
})
