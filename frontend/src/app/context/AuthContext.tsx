'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export type UserRole = 'participant' | 'volunteer' | 'staff'

export type User = {
  id: string
  email: string
  name: string
  role: UserRole
  membership?: string
  preferences?: string[]
  disabilities?: string
  mobilityStatus?: string
  homeAddress?: string
  homeCoordinates?: { lat: number; lng: number }
  onboardingComplete: boolean
}

type AuthContextType = {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string, role: UserRole) => Promise<{ success: boolean; error?: string }>
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string; user?: User }>
  logout: () => void
  updateOnboarding: (data: OnboardingData) => Promise<{ success: boolean; error?: string }>
}

type SignupData = {
  name: string
  email: string
  password: string
  role: UserRole
}

type OnboardingData = {
  membership: string
  preferences: string[]
  disabilities: string
  mobilityStatus: string
  homeAddress: string
  homeCoordinates: { lat: number; lng: number }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem('user')
        localStorage.removeItem('token')
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string, role: UserRole): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${apiBase}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      })

      const result = await response.json()

      if (!response.ok) {
        return { success: false, error: result.error || 'Login failed' }
      }

      localStorage.setItem('token', result.token)
      localStorage.setItem('user', JSON.stringify(result.user))
      setUser(result.user)

      return { success: true }
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  const signup = async (data: SignupData): Promise<{ success: boolean; error?: string; user?: User }> => {
    try {
      const response = await fetch(`${apiBase}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        return { success: false, error: result.error || 'Signup failed' }
      }

      localStorage.setItem('token', result.token)
      localStorage.setItem('user', JSON.stringify(result.user))
      setUser(result.user)

      return { success: true, user: result.user }
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const updateOnboarding = async (data: OnboardingData): Promise<{ success: boolean; error?: string }> => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${apiBase}/api/auth/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        return { success: false, error: result.error || 'Failed to update profile' }
      }

      localStorage.setItem('user', JSON.stringify(result.user))
      setUser(result.user)

      return { success: true }
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, updateOnboarding }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
