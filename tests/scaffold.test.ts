import { describe, expect, test } from 'vitest'
import pkg from '../package.json'

// Sanity test scaffold — digantikan unit uji nyata seiring masuknya kode (docs/TESTING.md §1).
describe('scaffold', () => {
  test('vitest berjalan dan proyek terdeteksi', () => {
    expect(pkg.name).toBe('aksibareng')
    expect(pkg.scripts.lint).toContain('eslint')
  })
})
