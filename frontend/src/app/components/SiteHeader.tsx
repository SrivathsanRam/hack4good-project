'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Calendar', href: '/calendar' },
  { label: 'Volunteer', href: '/volunteer' },
  { label: 'Staff Console', href: '/admin' },
]

export default function SiteHeader() {
  const pathname = usePathname() || '/'
  const normalized = pathname === '/' ? '/' : `/${pathname.split('/')[1]}`
  const activePath = pathname.startsWith('/activity') ? '/calendar' : normalized

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-text">
            <span className="brand-eyebrow">Minds</span>
            <span className="brand-title">Activities Hub</span>
          </span>
        </Link>
        <nav className="site-nav" aria-label="Primary">
          {navItems.map((item) => {
            const isActive = activePath === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${isActive ? 'active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="header-actions">
          <Link href="/calendar" className="button primary">
            View Schedule
          </Link>
        </div>
      </div>
    </header>
  )
}
