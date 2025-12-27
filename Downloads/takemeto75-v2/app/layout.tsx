import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TakeMeTo75 | Escape to 75°F in 72 Hours',
  description: 'One-click booking for spontaneous trips to perfect weather. Flight + Hotel packages leaving within 72 hours.',
  keywords: ['travel', 'spontaneous', 'last minute', 'warm weather', 'vacation'],
  openGraph: {
    title: 'TakeMeTo75 | Escape to 75°F',
    description: 'Book your escape to perfect weather in seconds',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
        <div className="noise-overlay" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
