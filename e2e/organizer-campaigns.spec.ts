import { test, expect, type Page } from '@playwright/test'

// C4/C5: alur kampanye organizer memakai sesi dan database seed (K-62, K-63).
async function login(page: Page, email: string, password = 'Demo#2026') {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Kata sandi').fill(password)
  await page.getByRole('button', { name: 'Masuk' }).click()
  await page.waitForURL('**/dashboard')
}

test('daftar kampanye organizer membaca data database dan status tinjauan', async ({ page }) => {
  await login(page, 'komunitas@aksibareng.test')
  await page.goto('/dashboard/organizer/campaigns')

  await expect(page.getByRole('heading', { level: 1, name: 'Kampanye saya' })).toBeVisible()
  await expect(page.getByText('Organisasi terverifikasi')).toBeVisible()
  await expect(page.getByRole('link', { name: '100 Meals for Cilacap' })).toBeVisible()
  await expect(page.getByText(/Versi 3/)).toBeVisible()
})

test('form menyimpan draf, revisi anggaran, lalu mengirim ke tinjauan admin', async ({ page }) => {
  await login(page, 'komunitas@aksibareng.test')
  await page.goto('/dashboard/organizer/campaigns/new')

  await page.getByLabel('Judul kampanye').fill('Dapur Umum Uji Sambung')
  await page.getByLabel('Lokasi umum').fill('Cilacap, Jawa Tengah')
  await page.getByLabel('Periode mulai').fill('2026-11-20')
  await page.getByLabel('Periode selesai').fill('2026-11-30')
  await page.getByLabel('Target donasi (ETH testnet)').fill('2,5')
  await page
    .getByLabel('Cerita dan kebutuhan')
    .fill('Warga terdampak banjir membutuhkan makanan siap saji selama dua minggu.')

  await page.getByLabel('Nominal (ETH testnet)', { exact: true }).fill('0,5')
  await page.getByRole('button', { name: 'Simpan versi anggaran' }).click()
  await expect(page.getByText(/Draf tersimpan dengan anggaran versi 1/)).toBeVisible()

  await page.getByLabel('Nominal (ETH testnet)', { exact: true }).fill('0,6')
  await page.getByRole('button', { name: 'Simpan versi anggaran' }).click()
  await expect(page.getByText('Riwayat versi anggaran (2)')).toBeVisible()
  await expect(page.getByText('Versi aktif')).toBeVisible()
  await expect(page.getByText(/^Diganti /).first()).toBeVisible()

  await page.getByRole('button', { name: 'Kirim untuk ditinjau' }).click()
  await expect(
    page.getByRole('heading', { name: 'Kampanye menunggu tinjauan admin' })
  ).toBeVisible()

  await page.getByRole('link', { name: 'Lihat kampanye saya' }).click()
  await page.waitForURL('**/dashboard/organizer/campaigns')
  await expect(page.getByText('Dapur Umum Uji Sambung')).toBeVisible()
  await expect(page.getByText(/Menunggu tinjauan/).first()).toBeVisible()
})

test('organizer dengan verifikasi PENDING melihat alasan dan tautan pengajuan', async ({ page }) => {
  await login(page, 'baru@aksibareng.test')
  await page.goto('/dashboard/organizer/campaigns/new')

  await expect(
    page.getByRole('heading', { name: 'Verifikasi organisasi sedang ditinjau' })
  ).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ajukan verifikasi organisasi' })).toHaveAttribute(
    'href',
    /^mailto:admin@aksibareng\.test/
  )
  await expect(page.getByRole('heading', { name: 'Informasi kampanye' })).toHaveCount(0)
})
