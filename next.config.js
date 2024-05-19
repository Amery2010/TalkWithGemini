/** @type {import('next').NextConfig} */

const mode = process.env.NEXT_PUBLIC_BUILD_MODE ?? 'standalone'

const nextConfig = {
  transpilePackages: ['crypto-js'],
  images: {
    unoptimized: mode === 'export',
  },
}
if (mode === 'export') {
  nextConfig.output = 'export'
  // Only used for static deployment, the default deployment directory is the root directory
  nextConfig.basePath = ''
} else if (mode === 'standalone') {
  nextConfig.output = 'standalone'
}

if (mode !== 'export') {
  nextConfig.rewrites = async () => {
    return {
      beforeFiles: [
        {
          source: '/api/google/:path*',
          destination: `https://generativelanguage.googleapis.com/:path*`,
        },
      ],
    }
  }
}

module.exports = nextConfig
