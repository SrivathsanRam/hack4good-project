import type { Metadata } from 'next'
import Link from 'next/link'
import { DM_Serif_Display, Manrope } from 'next/font/google'
import './globals.css'

const bodyFont = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
})

const displayFont = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-display',
})

export const metadata: Metadata = {
  title: 'Minds Activities Hub',
  description: 'Unified scheduling for participants, volunteers, and staff.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${bodyFont.variable} ${displayFont.variable}`}>
      <body className="app-shell">
        <div className="page">
          <header className="site-header">
            <div className="container header-inner">
              <Link href="/" className="brand">
                <span className="brand-mark" aria-hidden="true" />
                <span className="brand-text">
                  <span className="brand-eyebrow">Minds</span>
                  <span className="brand-title">Activities Hub</span>
                </span>
              </Link>
              <nav className="site-nav">
                <Link href="/" className="nav-link">
                  Home
                </Link>
                <Link href="/calendar" className="nav-link">
                  Calendar
                </Link>
                <Link href="/volunteer" className="nav-link">
                  Volunteer
                </Link>
                <Link href="/admin" className="nav-link">
                  Staff Console
                </Link>
              </nav>
              <div className="header-actions">
                <Link href="/calendar" className="button primary">
                  View Schedule
                </Link>
              </div>
            </div>
          </header>
          <main className="main-content">{children}</main>
          <footer className="site-footer">
            <div className="container footer-inner">
              <p className="footer-title">One calendar. Less admin.</p>
              <p className="footer-subtitle">
                Prototype UI shell for unified activity scheduling.
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
