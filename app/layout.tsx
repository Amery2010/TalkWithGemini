import type { Metadata } from 'next'
import ThemeProvider from '@/components/ThemeProvider'
import 'katex/dist/katex.min.css'
import 'highlight.js/styles/a11y-light.css'
import './globals.css'

export const metadata: Metadata = {
  title: 'Talk With Gemini',
  description: 'Talk with Gemini via voice.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
