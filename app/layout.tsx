import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'TakeMeTo75 - Escape to Perfect Weather',
  description: 'Book last-minute trips to destinations with perfect 75°F weather. AI-powered flight and hotel selection.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
