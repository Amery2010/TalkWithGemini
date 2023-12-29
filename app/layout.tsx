import type { Metadata } from 'next'
import 'katex/dist/katex.min.css'
import 'highlight.js/styles/a11y-light.css'
import './globals.css'

export const metadata: Metadata = {
  title: 'Talk With Gemini',
  description: 'Talk with Gemini via voice.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
