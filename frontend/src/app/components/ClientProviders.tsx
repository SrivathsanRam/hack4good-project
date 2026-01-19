'use client'

import { ReactNode } from 'react'
import { ToastProvider } from './ToastProvider'
import { AuthProvider } from '../context/AuthContext'

interface ClientProvidersProps {
  children: ReactNode
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <AuthProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </AuthProvider>
  )
}
