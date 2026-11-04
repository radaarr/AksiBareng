export type ClassValue = string | false | null | undefined

/** Gabung kelas kondisional tanpa dependensi tambahan. */
export function cx(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ')
}
