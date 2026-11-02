import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AksiBareng — Every Contribution Matters',
  description:
    'Platform manajemen kegiatan sosial, relawan, donasi, dan distribusi bantuan. MVP hackathon — donasi memakai aset testnet.'
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className="min-h-dvh bg-zinc-50 text-zinc-900 antialiased">{children}</body>
    </html>
  )
}
