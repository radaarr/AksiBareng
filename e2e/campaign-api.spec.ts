import { test, expect, type Page } from '@playwright/test'

// K-63: otorisasi dan transisi status diperiksa API, bukan hanya UI.
async function login(page: Page, email: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Kata sandi').fill('Demo#2026')
  await page.getByRole('button', { name: 'Masuk' }).click()
  await page.waitForURL('**/dashboard')
}

const payload = {
  title: 'Kampanye Uji API',
  story: 'Warga membutuhkan bantuan logistik selama dua minggu setelah banjir di wilayah ini.',
  categorySlug: 'pangan',
  periodStartsAt: '2026-11-20T00:00:00.000Z',
  periodEndsAt: '2026-11-30T00:00:00.000Z',
  targetAmountWei: '1000000000000000000',
  generalLocation: 'Cilacap, Jawa Tengah',
  budgetItems: [{ category: 'Logistik', plannedWei: '500000000000000000' }]
}

test('POST kampanye tanpa sesi ditolak 401', async ({ request }) => {
  const response = await request.post('/api/v1/campaigns', { data: payload })

  expect(response.status()).toBe(401)
  expect(response.headers()['content-type']).toContain('application/problem+json')
  const body = (await response.json()) as { code?: string }
  expect(body.code).toBe('UNAUTHENTICATED')
})

test('organizer belum terverifikasi ditolak 403 ORGANIZATION_NOT_VERIFIED', async ({ page }) => {
  await login(page, 'baru@aksibareng.test')
  const response = await page.request.post('/api/v1/campaigns', { data: payload })

  expect(response.status()).toBe(403)
  const body = (await response.json()) as { code?: string }
  expect(body.code).toBe('ORGANIZATION_NOT_VERIFIED')
})

test('draf dapat direvisi anggarannya lalu diajukan; perubahan setelah diajukan 409', async ({
  page
}) => {
  await login(page, 'komunitas@aksibareng.test')
  const created = await page.request.post('/api/v1/campaigns', { data: payload })
  expect(created.status()).toBe(201)
  const createdBody = (await created.json()) as { data: { id: string; status: string } }
  expect(createdBody.data.status).toBe('DRAFT')

  const budget = await page.request.put(`/api/v1/campaigns/${createdBody.data.id}/budget`, {
    data: { items: [{ category: 'Logistik', plannedWei: '750000000000000000' }] }
  })
  expect(budget.status()).toBe(200)
  const budgetBody = (await budget.json()) as { data: { version: number; totalWei: string } }
  expect(budgetBody.data.version).toBe(2)
  expect(budgetBody.data.totalWei).toBe('750000000000000000')

  const submitted = await page.request.post(
    `/api/v1/campaigns/${createdBody.data.id}/submit`
  )
  expect(submitted.status()).toBe(200)
  const submittedBody = (await submitted.json()) as { data: { status: string } }
  expect(submittedBody.data.status).toBe('PENDING_REVIEW')

  const patched = await page.request.patch(`/api/v1/campaigns/${createdBody.data.id}`, {
    data: { title: 'Judul Setelah Diajukan' }
  })
  expect(patched.status()).toBe(409)
  const patchedBody = (await patched.json()) as { code?: string }
  expect(patchedBody.code).toBe('INVALID_STATE_TRANSITION')
})
