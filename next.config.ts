import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Akses route internal hanya dari cron/scheduler Vercel — lihat docs/API.md §10
  poweredByHeader: false
}

export default nextConfig
