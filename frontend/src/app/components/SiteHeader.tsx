'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Calendar', href: '/calendar' },
  { label: 'Volunteer', href: '/volunteer' },
  { label: 'Participant', href: '/participant' },
  { label: 'Staff Console', href: '/admin' },
]

export default function SiteHeader() {
  const pathname = usePathname() || '/'
  const normalized = pathname === '/' ? '/' : `/${pathname.split('/')[1]}`
  const activePath = pathname.startsWith('/activity') ? '/calendar' : normalized
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Close mobile menu when window is resized to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900) {
        setMobileMenuOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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
        
        <button
          className={`mobile-menu-toggle ${mobileMenuOpen ? 'active' : ''}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-controls="main-nav"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <nav 
          id="main-nav"
          className={`site-nav ${mobileMenuOpen ? 'mobile-open' : ''}`} 
          aria-label="Primary"
        >
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
