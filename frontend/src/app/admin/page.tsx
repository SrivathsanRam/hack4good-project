'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'

export default function AdminPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading) {
      if (user && user.role === 'staff') {
        router.push('/admin/dashboard')
      } else {
        router.push('/admin/auth')
      }
    }
  }, [user, isLoading, router])

  return (
    <main className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div>Redirecting...</div>
    </main>
  )
}
