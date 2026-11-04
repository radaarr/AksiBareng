import type { z } from 'zod'

// Helper validasi lintas domain. Skema per fitur tetap di file masing-masing
// (docs/TEAM_PLAN.md §2); mapper error sengaja di sini supaya bentuk `errors[]`
// di docs/API.md §8 tidak berbeda antar modul.

export type FieldIssue = { field: string; message: string }

export function toFieldIssues(error: z.ZodError): FieldIssue[] {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || 'body',
    message: issue.message
  }))
}
