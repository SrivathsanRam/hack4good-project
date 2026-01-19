'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth, UserRole } from '../context/AuthContext'

type AuthMode = 'login' | 'signup'

interface AuthFormProps {
  role: UserRole
  roleName: string
  dashboardPath: string
}

export default function AuthForm({ role, roleName, dashboardPath }: AuthFormProps) {
  const router = useRouter()
  const { login, signup, user, isLoading: authLoading } = useAuth()
  
  const [mode, setMode] = useState<AuthMode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect if already logged in
  if (!authLoading && user && user.role === role) {
    if (role === 'participant' && !user.onboardingComplete) {
      router.push('/participant/onboarding')
    } else {
      router.push(dashboardPath)
    }
    return null
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    if (mode === 'signup') {
      if (!name.trim()) {
        setError('Name is required')
        setIsSubmitting(false)
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        setIsSubmitting(false)
        return
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters')
        setIsSubmitting(false)
        return
      }

      const result = await signup({ name, email, password, role })
      if (result.success) {
        if (role === 'participant') {
          router.push('/participant/onboarding')
        } else {
          router.push(dashboardPath)
        }
      } else {
        setError(result.error || 'Signup failed')
      }
    } else {
      const result = await login(email, password, role)
      if (result.success) {
        router.push(dashboardPath)
      } else {
        setError(result.error || 'Login failed')
      }
    }

    setIsSubmitting(false)
  }

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login')
    setError(null)
  }

  if (authLoading) {
    return (
      <main className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="loading-spinner">Loading...</div>
      </main>
    )
  }

  return (
    <main className="page">
      <section className="container" style={{ maxWidth: '480px', padding: '48px 24px' }}>
        <div className="auth-card" style={{ 
          background: 'var(--card)', 
          borderRadius: 'var(--radius-lg)', 
          padding: '40px',
          boxShadow: 'var(--shadow)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '1.75rem', marginBottom: '8px' }}>
              {mode === 'login' ? `${roleName} Login` : `Create ${roleName} Account`}
            </h1>
            <p style={{ color: 'var(--muted)' }}>
              {mode === 'login' 
                ? `Welcome back! Sign in to access your ${roleName.toLowerCase()} dashboard.`
                : `Join as a ${roleName.toLowerCase()} to get started.`
              }
            </p>
          </div>

          {error && (
            <div className="auth-error" style={{
              background: 'var(--toast-error-bg)',
              border: '1px solid var(--toast-error-border)',
              color: 'var(--toast-error-text)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '24px',
              fontSize: '0.9rem'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label htmlFor="name" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid var(--line)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '1rem',
                    background: 'var(--paper)'
                  }}
                  placeholder="Enter your full name"
                />
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label htmlFor="email" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '1rem',
                  background: 'var(--paper)'
                }}
                placeholder="Enter your email"
              />
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label htmlFor="password" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '1rem',
                  background: 'var(--paper)'
                }}
                placeholder="Enter your password"
              />
            </div>

            {mode === 'signup' && (
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid var(--line)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '1rem',
                    background: 'var(--paper)'
                  }}
                  placeholder="Confirm your password"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="button primary"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1
              }}
            >
              {isSubmitting 
                ? (mode === 'login' ? 'Signing in...' : 'Creating account...') 
                : (mode === 'login' ? 'Sign In' : 'Create Account')
              }
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <p style={{ color: 'var(--muted)' }}>
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={toggleMode}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  textDecoration: 'underline'
                }}
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>

          <div style={{ textAlign: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--line)' }}>
            <Link href="/" style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
              ← Back to Home
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
