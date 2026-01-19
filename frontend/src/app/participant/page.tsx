'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'

export default function ParticipantPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading) {
      if (user && user.role === 'participant') {
        if (user.onboardingComplete) {
          router.push('/participant/dashboard')
        } else {
          router.push('/participant/onboarding')
        }
      } else {
        router.push('/participant/auth')
      }
    }
  }, [user, isLoading, router])

  return (
    <main className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div>Redirecting...</div>
    </main>
  )
}
