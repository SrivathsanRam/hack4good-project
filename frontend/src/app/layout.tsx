import type { Metadata } from 'next'
import { DM_Serif_Display, Manrope } from 'next/font/google'
import SiteHeader from './components/SiteHeader'
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
          <a className="skip-link" href="#main-content">
            Skip to main content
          </a>
          <SiteHeader />
          <main className="main-content" id="main-content">
            {children}
          </main>
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
