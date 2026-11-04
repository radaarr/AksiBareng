import { test, expect } from '@playwright/test'

// C2: katalog & detail kampanye publik (K-61 di docs/TESTING.md).
test('katalog kampanye menampilkan kampanye publik dan label simulasi', async ({ page }) => {
  await page.goto('/campaigns')

  await expect(page.getByRole('heading', { level: 1, name: 'Katalog kampanye' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Dapur Umum untuk Warga Cilacap' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Air Bersih untuk Desa Nusa' })).toBeVisible()
  await expect(page.getByText(/SIMULASI — aset testnet Sepolia/).first()).toBeVisible()
})

test('detail kampanye memisahkan tiga angka dana dengan label sumber', async ({ page }) => {
  await page.goto('/campaigns/dapur-umum-cilacap')

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Dapur Umum')
  await expect(page.getByText('Terkumpul', { exact: true })).toBeVisible()
  await expect(page.getByText('Digunakan', { exact: true })).toBeVisible()
  await expect(page.getByText('Sisa', { exact: true })).toBeVisible()
  await expect(page.getByText('Dari blockchain').first()).toBeVisible()
  await expect(page.getByText('Dari catatan organizer').first()).toBeVisible()
  // Rencana anggaran dan riwayat versi lama tetap ada (CAM-03).
  await expect(page.getByRole('heading', { name: 'Rencana penggunaan dana' })).toBeVisible()
  await expect(page.getByText(/Riwayat versi anggaran \(1\)/)).toBeVisible()
})

// C3: laporan transparansi dan halaman verifikasi (K-45, K-46 di docs/TESTING.md).
test('laporan transparansi menampilkan sumber angka dan tautan explorer', async ({ page }) => {
  await page.goto('/campaigns/dapur-umum-cilacap/transparency')

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Transparansi')
  await expect(page.getByText('Terkumpul', { exact: true })).toBeVisible()
  await expect(page.getByText('Dari blockchain').first()).toBeVisible()
  await expect(page.getByText('Dari catatan organizer').first()).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Pengeluaran per kategori' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Status distribusi bantuan' })).toBeVisible()
  await expect(page.getByText(/SIMULASI — aset testnet Sepolia/).first()).toBeVisible()

  const explorerLink = page.getByRole('link', { name: /Lihat transaksi/ }).first()
  await expect(explorerLink).toHaveAttribute(
    'href',
    /^https:\/\/sepolia\.etherscan\.io\/tx\/0x[0-9a-f]{64}$/
  )
  await expect(explorerLink).toHaveAttribute('rel', /noopener/)
})

test('halaman verifikasi menerima hash valid dan menolak format salah', async ({ page }) => {
  await page.goto(`/verify?tx=0x${'a'.repeat(64)}`)

  await expect(page.getByRole('heading', { level: 1, name: 'Periksa catatan' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Buka di Etherscan Sepolia/ })).toHaveAttribute(
    'href',
    `https://sepolia.etherscan.io/tx/0x${'a'.repeat(64)}`
  )

  await page.goto('/verify?tx=bukan-hash')
  await expect(page.getByRole('alert')).toContainText('Format transaction hash tidak valid')
})

test('slug kampanye yang tidak ada menghasilkan 404 berbahasa Indonesia', async ({ page }) => {
  const response = await page.goto('/campaigns/kampanye-tidak-ada')

  expect(response?.status()).toBe(404)
  await expect(page.getByRole('heading', { name: 'Kampanye tidak ditemukan' })).toBeVisible()
})
