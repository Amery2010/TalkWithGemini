/** @type {import('next').NextConfig} */
const { PHASE_PRODUCTION_BUILD, PHASE_EXPORT } = require('next/constants')

const mode = process.env.NEXT_PUBLIC_BUILD_MODE
const basePath = process.env.EXPORT_BASE_PATH || ''
const apiKey = process.env.GEMINI_API_KEY || ''
const uploadProxyUrl = process.env.GEMINI_UPLOAD_BASE_URL || 'https://generativelanguage.googleapis.com'

/** @type {(phase: string, defaultConfig: import("next").NextConfig) => Promise<import("next").NextConfig>} */
module.exports = async (phase) => {
  const nextConfig = {
    transpilePackages: ['crypto-js', 'lodash-es'],
    images: {
      unoptimized: mode === 'export',
    },
  }
  if (mode === 'export') {
    nextConfig.output = 'export'
    // Only used for static deployment, the default deployment directory is the root directory
    nextConfig.basePath = basePath
  } else if (mode === 'standalone') {
    nextConfig.output = 'standalone'
  }

  if (mode !== 'export') {
    nextConfig.rewrites = async () => {
      return {
        beforeFiles: apiKey
          ? [
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
            ]
          : [
              {
                source: '/api/google/upload/v1beta/files',
                destination: '/api/upload/files',
              },
              {
                source: '/api/google/v1beta/files/:path',
                destination: '/api/upload/files?id=:path',
              },
            ],
      }
    }
  }

  if (phase === PHASE_PRODUCTION_BUILD || phase === PHASE_EXPORT) {
    const withSerwist = (await import('@serwist/next')).default({
      // Note: This is only an example. If you use Pages Router,
      // use something else that works, such as "service-worker/index.ts".
      swSrc: 'app/sw.ts',
      swDest: 'public/sw.js',
    })
    return withSerwist(nextConfig)
  }

  return nextConfig
}
