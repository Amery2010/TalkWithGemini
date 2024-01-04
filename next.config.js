/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['crypto-js'],
}
if (process.env.NEXT_BUILD_EXPORT) {
  nextConfig.output = 'export'
  // Only used for static deployment, the default deployment directory is the root directory
  nextConfig.basePath = ''
}

module.exports = nextConfig
