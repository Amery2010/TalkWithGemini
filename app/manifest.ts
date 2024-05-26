import { MetadataRoute } from 'next'

const mode = process.env.NEXT_PUBLIC_BUILD_MODE
const BASE_PATH = process.env.EXPORT_BASE_PATH || '/'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Talk with Gemini',
    short_name: 'Talk with Gemini',
    description:
      'Deploy your private Gemini application for free with one click, supporting Gemini 1.5 Pro, Gemini 1.5 Flash, Gemini Pro and Gemini Pro Vision models.',
    id: 'talk-with-gemini',
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
    screenshots: [
      {
        src: './screenshots/app.jpg',
        sizes: '2048x1192',
        type: 'image/jpeg',
      },
      {
        src: './screenshots/app.jpg',
        sizes: '3840x1726',
        type: 'image/jpeg',
      },
      {
        src: './screenshots/app.jpg',
        sizes: '3840x1744',
        type: 'image/jpeg',
      },
    ],
    theme_color: '#FFFFFF',
    background_color: '#FFFFFF',
    start_url: mode === 'export' ? BASE_PATH : '/',
    display: 'standalone',
    orientation: 'portrait',
  }
}
