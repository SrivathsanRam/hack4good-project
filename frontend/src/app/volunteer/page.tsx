'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'

export default function VolunteerPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading) {
      if (user && user.role === 'volunteer') {
        router.push('/volunteer/dashboard')
      } else {
        router.push('/volunteer/auth')
      }
    }
  }, [user, isLoading, router])

  return (
    <main className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div>Redirecting...</div>
    </main>
  )
}
