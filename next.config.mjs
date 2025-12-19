/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://chatwsc.lfautomacoes.com.br",
          },
          {
            key: 'X-Frame-Options',
            value: 'ALLOW-FROM https://chatwsc.lfautomacoes.com.br',
          },
        ],
      },
    ]
  },
}

export default nextConfig