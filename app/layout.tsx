import type { Metadata } from 'next'
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
