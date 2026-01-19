'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { ActivityCardSkeleton } from '../../components/Skeleton'

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

type Activity = {
  id: string
  title: string
  date: string
  startTime: string
  endTime: string
  location: string
  program: string
  role: 'Participants' | 'Volunteers'
  capacity: number
  seatsLeft: number
  cadence: string
  description: string
  wheelchairAccessible: boolean
  paymentRequired: boolean
  paymentAmount?: number
}

const formatDate = (isoDate: string) => {
  const date = new Date(`${isoDate}T00:00:00`)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export default function ParticipantDashboard() {
  const router = useRouter()
  const { user, logout, isLoading: authLoading } = useAuth()
  
  const [activities, setActivities] = useState<Activity[]>([])
  const [registeredIds, setRegisteredIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'upcoming' | 'registered'>('upcoming')

  // Redirect if not logged in or not a participant
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/participant/auth')
      } else if (user.role !== 'participant') {
        router.push('/')
      } else if (!user.onboardingComplete) {
        router.push('/participant/onboarding')
      }
    }
  }, [user, authLoading, router])

  // Fetch activities
  useEffect(() => {
    if (!user || user.role !== 'participant') return

    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [activitiesRes, registrationsRes] = await Promise.all([
          fetch(`${apiBase}/api/activities?role=Participants`),
          fetch(`${apiBase}/api/registrations`)
        ])

        if (!activitiesRes.ok) throw new Error('Failed to fetch activities')
        
        const activitiesData = await activitiesRes.json()
        setActivities(activitiesData.data || [])

        if (registrationsRes.ok) {
          const registrationsData = await registrationsRes.json()
          const userRegistrations = (registrationsData.data || [])
            .filter((r: any) => r.email === user.email)
            .map((r: any) => r.activityId)
          setRegisteredIds(userRegistrations)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load activities')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user])

  const upcomingActivities = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return activities
      .filter(a => new Date(`${a.date}T00:00:00`) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [activities])

  const registeredActivities = useMemo(() => {
    return activities.filter(a => registeredIds.includes(a.id))
  }, [activities, registeredIds])

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  if (authLoading || !user) {
    return (
      <main className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div>Loading...</div>
      </main>
    )
  }

  return (
    <main className="page">
      <section className="container" style={{ padding: '32px 24px' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '32px'
        }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', marginBottom: '8px' }}>
              Welcome back, {user.name}! 👋
            </h1>
            <p style={{ color: 'var(--muted)' }}>
              {user.membership} member • {user.mobilityStatus}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="button outline"
            style={{ padding: '8px 16px', fontSize: '0.9rem' }}
          >
            Sign Out
          </button>
        </div>

        {/* Quick Stats */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>
          <div style={{ 
            background: 'var(--card)', 
            padding: '20px', 
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '4px' }}>
              Registered Activities
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>
              {registeredIds.length}
            </div>
          </div>
          <div style={{ 
            background: 'var(--card)', 
            padding: '20px', 
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '4px' }}>
              Upcoming This Week
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>
              {upcomingActivities.filter(a => {
                const actDate = new Date(`${a.date}T00:00:00`)
                const weekFromNow = new Date()
                weekFromNow.setDate(weekFromNow.getDate() + 7)
                return actDate <= weekFromNow
              }).length}
            </div>
          </div>
          <div style={{ 
            background: 'var(--card)', 
            padding: '20px', 
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '4px' }}>
              Your Preferences
            </div>
            <div style={{ fontSize: '0.9rem' }}>
              {user.preferences?.length ? user.preferences.join(', ') : 'None set'}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '24px',
          borderBottom: '1px solid var(--line)',
          paddingBottom: '16px'
        }}>
          <button
            onClick={() => setActiveTab('upcoming')}
            style={{
              padding: '8px 16px',
              background: activeTab === 'upcoming' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'upcoming' ? 'white' : 'var(--ink)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            Upcoming Activities
          </button>
          <button
            onClick={() => setActiveTab('registered')}
            style={{
              padding: '8px 16px',
              background: activeTab === 'registered' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'registered' ? 'white' : 'var(--ink)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            My Registrations ({registeredIds.length})
          </button>
          <Link
            href="/calendar"
            className="button outline"
            style={{ marginLeft: 'auto', padding: '8px 16px', fontSize: '0.9rem' }}
          >
            View Full Calendar
          </Link>
        </div>

        {/* Content */}
        {isLoading ? (
          <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {[1, 2, 3].map(i => <ActivityCardSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div style={{ 
            background: 'var(--toast-error-bg)', 
            padding: '16px', 
            borderRadius: 'var(--radius-sm)',
            color: 'var(--toast-error-text)'
          }}>
            {error}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {(activeTab === 'upcoming' ? upcomingActivities : registeredActivities).map(activity => (
              <Link
                key={activity.id}
                href={`/activity/${activity.id}`}
                style={{
                  background: 'var(--card)',
                  padding: '20px',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span style={{ 
                    padding: '4px 8px', 
                    background: 'var(--accent-soft)', 
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}>
                    {activity.program}
                  </span>
                  {registeredIds.includes(activity.id) && (
                    <span style={{ 
                      padding: '4px 8px', 
                      background: 'var(--sage)', 
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '0.75rem'
                    }}>
                      Registered
                    </span>
                  )}
                </div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>{activity.title}</h3>
                <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '8px' }}>
                  {formatDate(activity.date)} • {activity.startTime} - {activity.endTime}
                </p>
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '12px' }}>
                  📍 {activity.location}
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {activity.wheelchairAccessible && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--sage)' }}>♿ Accessible</span>
                  )}
                  {activity.paymentRequired && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>
                      💰 ${activity.paymentAmount}
                    </span>
                  )}
                  <span style={{ fontSize: '0.8rem', color: 'var(--muted)', marginLeft: 'auto' }}>
                    {activity.seatsLeft} seats left
                  </span>
                </div>
              </Link>
            ))}
            {(activeTab === 'upcoming' ? upcomingActivities : registeredActivities).length === 0 && (
              <div style={{ 
                gridColumn: '1 / -1',
                textAlign: 'center', 
                padding: '48px', 
                color: 'var(--muted)' 
              }}>
                {activeTab === 'upcoming' 
                  ? 'No upcoming activities available.' 
                  : "You haven't registered for any activities yet."}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  )
}
