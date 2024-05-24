import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import ThemeProvider from '@/components/ThemeProvider'
import StoreProvider from '@/components/StoreProvider'
import I18Provider from '@/components/I18nProvider'
import { Toaster } from '@/components/ui/toaster'
import { isUndefined } from 'lodash-es'

import 'katex/dist/katex.min.css'
import 'highlight.js/styles/a11y-light.css'
import './globals.css'

const HEAD_SCRIPTS = process.env.HEAD_SCRIPTS as string
const ENABLE_PROTECT = !isUndefined(process.env.ACCESS_PASSWORD)

export const metadata: Metadata = {
  title: 'Talk with Gemini - 与 Gemini 交谈',
  description: 'Talk with Gemini via voice. 通过声音与 Gemini 交谈。',
  keywords: ['Gemini', 'Gemini Pro', 'Gemini Chat', 'AI', 'voice', 'Free Chatgpt', 'Chatgpt'],
  icons: {
    icon: {
      type: 'image/svg+xml',
      url: '/logo.svg',
    },
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
  minimumScale: 1.0,
  maximumScale: 1.0,
  viewportFit: 'cover',
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>{HEAD_SCRIPTS ? <Script id="headscript">{HEAD_SCRIPTS}</Script> : null}</head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <StoreProvider isProtected={ENABLE_PROTECT}>
            <I18Provider>{children}</I18Provider>
          </StoreProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  )
}
