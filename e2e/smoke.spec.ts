import { test, expect } from '@playwright/test'

// Smoke test PR-1: landing harus ter-render dengan konten utama.
test('halaman landing menampilkan AksiBareng', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/AksiBareng/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('AksiBareng')
  // Label simulasi wajib tampil (docs/UI_UX.md §5)
  await expect(page.getByText(/SIMULASI/)).toBeVisible()
})
