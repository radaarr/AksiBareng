import NextAuth, { CredentialsSignin } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { headers } from 'next/headers'
import { prisma } from '@/lib/db'
import { verifyPassword } from '@/lib/auth/password'
import { loginSchema } from '@/lib/validation/auth'
import { rateLimit } from '@/lib/api/rate-limit'

// docs/API.md §1.2: login 10 percobaan / 15 menit / IP+email.
const LOGIN_LIMIT = 10
const LOGIN_WINDOW_MS = 15 * 60 * 1000

class RateLimitedSignIn extends CredentialsSignin {
  code = 'rate_limited'
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // JWT tanpa adapter DB; role tetap dibaca ulang dari database di lib/auth/session.ts.
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 },
  // Handler dipasang di /api/v1/auth, bukan default /api/auth — tanpa ini endpoint
  // csrf/callback menjawab 400 dan login tidak pernah berhasil.
  basePath: '/api/v1/auth',
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Kata sandi', type: 'password' }
      },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const email = parsed.data.email.trim().toLowerCase()
        const clientIp = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || 'lokal'

        const limit = rateLimit(`login:${clientIp}:${email}`, LOGIN_LIMIT, LOGIN_WINDOW_MS)
        if (!limit.allowed) throw new RateLimitedSignIn()

        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, email: true, displayName: true, passwordHash: true, status: true }
        })

        // Pesan gagal diseragamkan: jangan membocorkan email mana yang terdaftar.
        if (!user || user.status !== 'ACTIVE') return null
        if (!(await verifyPassword(user.passwordHash, parsed.data.password))) return null

        await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })

        return { id: user.id, email: user.email, name: user.displayName }
      }
    })
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.uid = user.id
      return token
    },
    session({ session, token }) {
      if (typeof token.uid === 'string') session.user.id = token.uid
      return session
    }
  }
})
