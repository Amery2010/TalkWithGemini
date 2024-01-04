import type { Metadata } from 'next'
import Script from 'next/script'
import ThemeProvider from '@/components/ThemeProvider'
import StoreProvider from '@/components/StoreProvider'
import I18Provider from '@/components/I18nProvider'

import 'katex/dist/katex.min.css'
import 'highlight.js/styles/a11y-light.css'
import './globals.css'

const HEAD_SCRIPTS = process.env.HEAD_SCRIPTS as string

export const metadata: Metadata = {
  title: 'Talk with Gemini - 与 Gemini 交谈',
  description: 'Talk with Gemini via voice. 通过声音与 Gemini 交谈。',
  keywords: ['Gemini', 'Gemini Pro', 'Gemini Chat', 'AI', 'voice', 'Free Chatgpt', 'Chatgpt'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>{HEAD_SCRIPTS ? <Script id="headscript">{HEAD_SCRIPTS}</Script> : null}</head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <StoreProvider>
            <I18Provider>{children}</I18Provider>
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
