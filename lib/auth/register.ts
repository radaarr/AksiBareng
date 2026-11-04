import { Prisma, type UserRole } from '@prisma/client'
import { prisma } from '@/lib/db'
import { hashPassword } from './password'
import { registerSchema, toFieldIssues, type FieldIssue } from '@/lib/validation/auth'

export type RegisterResult = { id: string; role: UserRole }

export class InvalidRegistrationError extends Error {
  constructor(readonly issues: FieldIssue[]) {
    super('VALIDATION_ERROR')
  }
}

export class EmailTakenError extends Error {
  constructor() {
    super('EMAIL_TAKEN')
  }
}

// Satu sumber untuk pendaftaran: dipakai route handler dan (nanti) form server.
// Role selalu VOLUNTEER — tidak ada jalur eskalasi mandiri (docs/RBAC.md §2 poin 4).
export async function registerUser(input: unknown): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(input)
  if (!parsed.success) throw new InvalidRegistrationError(toFieldIssues(parsed.error))

  const email = parsed.data.email.trim().toLowerCase()

  try {
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await hashPassword(parsed.data.password),
        displayName: parsed.data.displayName
      },
      select: { id: true, role: true }
    })

    return { id: user.id, role: user.role }
  } catch (error) {
    // Constraint users_email_lower_key / users.email_unik mencegah pendaftaran ganda
    // walau dua request datang bersamaan.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new EmailTakenError()
    }
    throw error
  }
}
