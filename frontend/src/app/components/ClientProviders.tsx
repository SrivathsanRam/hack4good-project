'use client'

import { ReactNode } from 'react'
import { ToastProvider } from './ToastProvider'

interface ClientProvidersProps {
  children: ReactNode
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  )
}
