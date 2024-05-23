/** @type {import('next').NextConfig} */

const mode = process.env.NEXT_PUBLIC_BUILD_MODE ?? 'standalone'
const apiKey = process.env.GEMINI_API_KEY ?? ''
const uploadProxyUrl = process.env.GEMINI_UPLOAD_BASE_URL ?? 'https://generativelanguage.googleapis.com'

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
          source: '/api/google/upload/v1beta/files',
          has: [
            {
              type: 'query',
              key: 'uploadType',
              value: '(?<uploadType>.*)',
            },
          ],
          destination: `${uploadProxyUrl}/upload/v1beta/files?key=${apiKey}&uploadType=:uploadType`,
        },
        {
          source: '/api/google/v1beta/files/:id',
          destination: `${uploadProxyUrl}/v1beta/files/:id?key=${apiKey}`,
        },
      ],
    }
  }
}

module.exports = nextConfig
