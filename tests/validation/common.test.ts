import { describe, expect, test } from 'vitest'
import { z } from 'zod'
import { toFieldIssues } from '@/lib/validation/common'

describe('toFieldIssues', () => {
  test('memakai nama field dari path bersarang', () => {
    const schema = z.object({ amountWei: z.string().min(1, 'Wajib diisi.') })
    const result = schema.safeParse({ amountWei: '' })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(toFieldIssues(result.error)).toEqual([{ field: 'amountWei', message: 'Wajib diisi.' }])
    }
  })

  test('error tingkat root dipetakan ke "body"', () => {
    const schema = z.object({}).refine(() => false, { message: 'Body tidak dikenali.' })
    const result = schema.safeParse({})

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(toFieldIssues(result.error)).toEqual([{ field: 'body', message: 'Body tidak dikenali.' }])
    }
  })
})
