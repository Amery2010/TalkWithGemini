import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Talk with Gemini PWA App',
    short_name: 'Talk with Gemini',
    icons: [
      {
        src: './icons/logo-192x192.png',
        sizes: '72x72 96x96 128x128 152x152 167x167 180x180 192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: './icons/logo-512x512.png',
        sizes: '256x256 512x512',
        type: 'image/png',
      },
      {
        src: './logo.svg',
        sizes: 'any',
        type: 'svg+xml',
      },
    ],
    theme_color: '#FFFFFF',
    background_color: '#FFFFFF',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
  }
}
