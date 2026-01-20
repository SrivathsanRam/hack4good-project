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
  roles?: string[]
  role?: 'Participants' | 'Volunteers'
  participantCapacity?: number
  volunteerCapacity?: number
  participantSeatsLeft?: number
  volunteerSeatsLeft?: number
  capacity?: number
  seatsLeft?: number
  type?: string
  cadence?: string
  description: string
  imageUrl?: string
  featured?: boolean
}

type Registration = {
  id: string
  activityId: string
  name: string
  email: string
  role: 'Participant' | 'Volunteer'
  attended: boolean
}

const formatDate = (isoDate: string) => {
  const date = new Date(`${isoDate}T00:00:00`)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export default function AdminDashboard() {
  const router = useRouter()
  const { user, logout, isLoading: authLoading } = useAuth()
  
  const [activities, setActivities] = useState<Activity[]>([])
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [featuringId, setFeaturingId] = useState<string | null>(null)

  // Redirect if not logged in or not staff
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/admin/auth')
      } else if (user.role !== 'staff') {
        router.push('/')
      }
    }
  }, [user, authLoading, router])

  // Fetch data
  useEffect(() => {
    if (!user || user.role !== 'staff') return

    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [activitiesRes, registrationsRes] = await Promise.all([
          fetch(`${apiBase}/api/activities`),
          fetch(`${apiBase}/api/registrations`)
        ])

        if (!activitiesRes.ok) throw new Error('Failed to fetch activities')
        
        const activitiesData = await activitiesRes.json()
        setActivities(activitiesData.data || [])

        if (registrationsRes.ok) {
          const registrationsData = await registrationsRes.json()
          setRegistrations(registrationsData.data || [])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user])

  const getCapacity = (a: Activity) => {
    return (a.participantCapacity ?? 0) + (a.volunteerCapacity ?? 0) || a.capacity || 0
  }
  
  const getSeatsLeft = (a: Activity) => {
    return (a.participantSeatsLeft ?? 0) + (a.volunteerSeatsLeft ?? 0) || a.seatsLeft || 0
  }

  const stats = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const upcoming = activities.filter(a => new Date(`${a.date}T00:00:00`) >= today)
    const participantActivities = activities.filter(a => 
      a.roles?.includes('Participants') || a.role === 'Participants'
    )
    const volunteerActivities = activities.filter(a => 
      a.roles?.includes('Volunteers') || a.role === 'Volunteers'
    )
    const totalRegistrations = registrations.length
    const totalCapacity = activities.reduce((sum, a) => sum + getCapacity(a), 0)
    const totalBooked = activities.reduce((sum, a) => sum + (getCapacity(a) - getSeatsLeft(a)), 0)

    return {
      total: activities.length,
      upcoming: upcoming.length,
      participantActivities: participantActivities.length,
      volunteerActivities: volunteerActivities.length,
      totalRegistrations,
      occupancyRate: totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0
    }
  }, [activities, registrations])

  const handleFeature = async (activityId: string, currentlyFeatured: boolean) => {
    setFeaturingId(activityId)
    try {
      if (currentlyFeatured) {
        // Unfeature the activity
        await fetch(`${apiBase}/api/activities/${activityId}/feature`, {
          method: 'DELETE',
        })
        setActivities(prev => prev.map(a => 
          a.id === activityId ? { ...a, featured: false } : a
        ))
      } else {
        // Feature the activity (will unfeature others)
        await fetch(`${apiBase}/api/activities/${activityId}/feature`, {
          method: 'POST',
        })
        setActivities(prev => prev.map(a => ({
          ...a,
          featured: a.id === activityId
        })))
      }
    } catch (err) {
      console.error('Failed to update featured status:', err)
    } finally {
      setFeaturingId(null)
    }
  }

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
              Staff Dashboard 🛠️
            </h1>
            <p style={{ color: 'var(--muted)' }}>
              Welcome, {user.name}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link
              href="/admin/calendar"
              className="button primary"
              style={{ padding: '8px 16px', fontSize: '0.9rem' }}
            >
              Manage Activities Calendar
            </Link>
            <Link
              href="/admin/notifications"
              className="button primary"
              style={{ padding: '8px 16px', fontSize: '0.9rem', background: 'var(--sage)' }}
            >
              📣 Notifications
            </Link>
            <button
              onClick={handleLogout}
              className="button outline"
              style={{ padding: '8px 16px', fontSize: '0.9rem' }}
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
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
              Total Activities
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>
              {stats.total}
            </div>
          </div>
          <div style={{ 
            background: 'var(--card)', 
            padding: '20px', 
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '4px' }}>
              Upcoming
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>
              {stats.upcoming}
            </div>
          </div>
          <div style={{ 
            background: 'var(--card)', 
            padding: '20px', 
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '4px' }}>
              Total Registrations
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>
              {stats.totalRegistrations}
            </div>
          </div>
          <div style={{ 
            background: 'var(--card)', 
            padding: '20px', 
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '4px' }}>
              Occupancy Rate
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>
              {stats.occupancyRate}%
            </div>
          </div>
        </div>


        {/* Recent Activities */}
        <h2 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Recent Activities</h2>
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
            {activities.slice(0, 6).map(activity => (
              <div
                key={activity.id}
                style={{
                  background: 'var(--card)',
                  padding: '20px',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span style={{ 
                    padding: '4px 8px', 
                    background: (activity.roles?.includes('Participants') || activity.role === 'Participants') ? 'var(--accent-soft)' : 'var(--line)', 
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}>
                    {activity.roles?.join(', ') || activity.role}
                  </span>
                  <span style={{ 
                    padding: '4px 8px', 
                    background: 'var(--sage)', 
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '0.75rem'
                  }}>
                    {getCapacity(activity) - getSeatsLeft(activity)}/{getCapacity(activity)}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>{activity.title}</h3>
                <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '8px' }}>
                  {formatDate(activity.date)} • {activity.startTime} - {activity.endTime}
                </p>
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '12px' }}>
                  📍 {activity.location}
                </p>
                <button
                  onClick={() => handleFeature(activity.id, activity.featured || false)}
                  disabled={featuringId === activity.id}
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.8rem',
                    borderRadius: '6px',
                    border: activity.featured ? '1px solid var(--accent)' : '1px solid var(--line)',
                    background: activity.featured ? 'var(--accent)' : 'transparent',
                    color: activity.featured ? 'white' : 'var(--muted)',
                    cursor: featuringId === activity.id ? 'wait' : 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {featuringId === activity.id ? '...' : activity.featured ? '⭐ Featured' : '☆ Feature'}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
