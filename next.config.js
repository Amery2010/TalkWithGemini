/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['crypto-js'],
}
if (process.env.NEXT_BUILD_MODE === 'export') {
  nextConfig.output = 'export'
  // Only used for static deployment, the default deployment directory is the root directory
  nextConfig.basePath = ''
} else if (process.env.NEXT_BUILD_MODE === 'standalone') {
  nextConfig.output = 'standalone'
}

module.exports = nextConfig
