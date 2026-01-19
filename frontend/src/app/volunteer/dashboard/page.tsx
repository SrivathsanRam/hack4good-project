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
}

const formatDate = (isoDate: string) => {
  const date = new Date(`${isoDate}T00:00:00`)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export default function VolunteerDashboard() {
  const router = useRouter()
  const { user, logout, isLoading: authLoading } = useAuth()
  
  const [activities, setActivities] = useState<Activity[]>([])
  const [commitmentIds, setCommitmentIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'opportunities' | 'commitments'>('opportunities')

  // Redirect if not logged in or not a volunteer
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/volunteer/auth')
      } else if (user.role !== 'volunteer') {
        router.push('/')
      }
    }
  }, [user, authLoading, router])

  // Fetch activities
  useEffect(() => {
    if (!user || user.role !== 'volunteer') return

    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [activitiesRes, registrationsRes] = await Promise.all([
          fetch(`${apiBase}/api/activities?role=Volunteers`),
          fetch(`${apiBase}/api/registrations`)
        ])

        if (!activitiesRes.ok) throw new Error('Failed to fetch activities')
        
        const activitiesData = await activitiesRes.json()
        setActivities(activitiesData.data || [])

        if (registrationsRes.ok) {
          const registrationsData = await registrationsRes.json()
          const userCommitments = (registrationsData.data || [])
            .filter((r: any) => r.email === user.email && r.role === 'Volunteer')
            .map((r: any) => r.activityId)
          setCommitmentIds(userCommitments)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load activities')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user])

  const upcomingOpportunities = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return activities
      .filter(a => new Date(`${a.date}T00:00:00`) >= today && !commitmentIds.includes(a.id))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [activities, commitmentIds])

  const myCommitments = useMemo(() => {
    return activities.filter(a => commitmentIds.includes(a.id))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [activities, commitmentIds])

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
              Volunteer Dashboard 🙌
            </h1>
            <p style={{ color: 'var(--muted)' }}>
              Welcome, {user.name}
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
              My Commitments
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>
              {commitmentIds.length}
            </div>
          </div>
          <div style={{ 
            background: 'var(--card)', 
            padding: '20px', 
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '4px' }}>
              Open Opportunities
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>
              {upcomingOpportunities.length}
            </div>
          </div>
          <div style={{ 
            background: 'var(--card)', 
            padding: '20px', 
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '4px' }}>
              This Week
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>
              {myCommitments.filter(a => {
                const actDate = new Date(`${a.date}T00:00:00`)
                const weekFromNow = new Date()
                weekFromNow.setDate(weekFromNow.getDate() + 7)
                return actDate <= weekFromNow
              }).length}
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
            onClick={() => setActiveTab('opportunities')}
            style={{
              padding: '8px 16px',
              background: activeTab === 'opportunities' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'opportunities' ? 'white' : 'var(--ink)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            Volunteer Opportunities
          </button>
          <button
            onClick={() => setActiveTab('commitments')}
            style={{
              padding: '8px 16px',
              background: activeTab === 'commitments' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'commitments' ? 'white' : 'var(--ink)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            My Commitments ({commitmentIds.length})
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
            {(activeTab === 'opportunities' ? upcomingOpportunities : myCommitments).map(activity => (
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
                  {commitmentIds.includes(activity.id) && (
                    <span style={{ 
                      padding: '4px 8px', 
                      background: 'var(--sage)', 
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '0.75rem'
                    }}>
                      Committed
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ 
                    padding: '4px 8px', 
                    background: 'var(--line)', 
                    borderRadius: '4px',
                    fontSize: '0.75rem'
                  }}>
                    {activity.cadence}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                    {activity.seatsLeft} spots left
                  </span>
                </div>
              </Link>
            ))}
            {(activeTab === 'opportunities' ? upcomingOpportunities : myCommitments).length === 0 && (
              <div style={{ 
                gridColumn: '1 / -1',
                textAlign: 'center', 
                padding: '48px', 
                color: 'var(--muted)' 
              }}>
                {activeTab === 'opportunities' 
                  ? 'No volunteer opportunities available right now.' 
                  : "You haven't signed up for any volunteer shifts yet."}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  )
}
