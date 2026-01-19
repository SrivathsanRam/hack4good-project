'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { ActivityCardSkeleton } from '../../components/Skeleton'
import CalendarGrid from '../../components/CalendarGrid'
import ActivityModal from '../../components/ActivityModal'
import { Activity } from '../../components/ActivityCard'

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

const programOptions = ['All programs', 'Movement', 'Creative', 'Caregiver sessions']

export default function VolunteerDashboard() {
  const router = useRouter()
  const { user, logout, isLoading: authLoading } = useAuth()
  
  const [activities, setActivities] = useState<Activity[]>([])
  const [commitmentIds, setCommitmentIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Modal state
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [registering, setRegistering] = useState(false)
  const [unregistering, setUnregistering] = useState(false)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [programFilter, setProgramFilter] = useState('All programs')
  const [accessibilityFilter, setAccessibilityFilter] = useState(false)

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
        // Fetch all activities and filter client-side for volunteer-related roles
        const [activitiesRes, registrationsRes] = await Promise.all([
          fetch(`${apiBase}/api/activities`),
          fetch(`${apiBase}/api/registrations`)
        ])

        if (!activitiesRes.ok) throw new Error('Failed to fetch activities')
        
        const activitiesData = await activitiesRes.json()
        // Filter for activities that include Volunteer or Volunteers Only in roles
        const allActivities = activitiesData.data || []
        const volunteerActivities = allActivities.filter((a: Activity) => {
          const roles = a.roles || (a.role ? [a.role] : [])
          return roles.includes('Volunteer') || roles.includes('Volunteers Only')
        })
        setActivities(volunteerActivities)

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

  // Filter activities
  const filteredActivities = useMemo(() => {
    const searchLower = searchTerm.toLowerCase().trim()
    
    return activities.filter((activity) => {
      const matchesProgram = programFilter === 'All programs' || activity.program === programFilter
      const matchesSearch = !searchLower || 
        [activity.title, activity.location, activity.program]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(searchLower))
      const matchesAccessibility = !accessibilityFilter || activity.wheelchairAccessible
      
      return matchesProgram && matchesSearch && matchesAccessibility
    })
  }, [activities, programFilter, searchTerm, accessibilityFilter])

  // Upcoming opportunities (next 7 days, not yet committed)
  const upcomingOpportunities = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const weekFromNow = new Date(today)
    weekFromNow.setDate(weekFromNow.getDate() + 7)
    
    return filteredActivities
      .filter(a => {
        const actDate = new Date(`${a.date}T00:00:00`)
        return actDate >= today && actDate <= weekFromNow
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5)
  }, [filteredActivities])

  // My commitments
  const myCommitments = useMemo(() => {
    return activities
      .filter(a => commitmentIds.includes(a.id))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [activities, commitmentIds])

  const handleActivityClick = (activity: Activity) => {
    setSelectedActivity(activity)
  }

  const handleCommit = async (activity: Activity) => {
    if (!user) return
    
    setRegistering(true)
    try {
      const response = await fetch(`${apiBase}/api/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityId: activity.id,
          name: user.name,
          email: user.email,
          role: 'Volunteer',
          membership: 'Ad hoc', // Valid enum value for registration
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Registration failed:', response.status, errorData)
        throw new Error(errorData.error || 'Commitment failed')
      }
      
      setCommitmentIds(prev => [...prev, activity.id])
      setSelectedActivity(null)
    } catch (err) {
      console.error('Commitment error:', err)
      alert(err instanceof Error ? err.message : 'Failed to commit to activity')
    } finally {
      setRegistering(false)
    }
  }

  const handleUncommit = async (activity: Activity) => {
    if (!user) return
    
    setUnregistering(true)
    try {
      const response = await fetch(
        `${apiBase}/api/registrations/by-activity/${activity.id}?email=${encodeURIComponent(user.email)}&role=Volunteer`,
        { method: 'DELETE' }
      )
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Unregister failed:', response.status, errorData)
        throw new Error(errorData.error || 'Failed to withdraw commitment')
      }
      
      setCommitmentIds(prev => prev.filter(id => id !== activity.id))
      setSelectedActivity(null)
    } catch (err) {
      console.error('Uncommit error:', err)
      alert(err instanceof Error ? err.message : 'Failed to withdraw commitment')
    } finally {
      setUnregistering(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const formatUpcomingDate = (isoDate: string) => {
    const date = new Date(`${isoDate}T00:00:00`)
    return {
      day: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
    }
  }

  const formatTime = (time?: string) => {
    const safe = time || '00:00'
    const [hours, minutes] = safe.split(':')
    const hour = parseInt(hours, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const filtersActive = programFilter !== 'All programs' || searchTerm.trim() !== '' || accessibilityFilter

  const isVolunteersOnly = (activity: Activity) => {
    const roles = activity.roles || (activity.role ? [activity.role] : [])
    return roles.includes('Volunteers Only')
  }

  const resetFilters = () => {
    setProgramFilter('All programs')
    setSearchTerm('')
    setAccessibilityFilter(false)
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
      <section className="container-wide" style={{ padding: '32px 24px' }}>
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Volunteer Dashboard 🙌</h1>
            <p className="dashboard-subtitle">Welcome, {user.name}</p>
          </div>
          <button onClick={handleLogout} className="button outline">
            Sign Out
          </button>
        </div>

        {/* Quick Stats */}
        <div className="dashboard-stats">
          <div className="stat-box">
            <div className="stat-box-label">My Commitments</div>
            <div className="stat-box-value">{commitmentIds.length}</div>
          </div>
          <div className="stat-box">
            <div className="stat-box-label">Open Opportunities</div>
            <div className="stat-box-value">{upcomingOpportunities.filter(a => !commitmentIds.includes(a.id)).length}</div>
          </div>
          <div className="stat-box">
            <div className="stat-box-label">This Week</div>
            <div className="stat-box-value">
              {myCommitments.filter(a => {
                const actDate = new Date(`${a.date}T00:00:00`)
                const weekFromNow = new Date()
                weekFromNow.setDate(weekFromNow.getDate() + 7)
                return actDate <= weekFromNow
              }).length}
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-box-label">Total Opportunities</div>
            <div className="stat-box-value">{activities.length}</div>
          </div>
        </div>

        {/* My Commitments */}
        {myCommitments.length > 0 && (
          <div className="dashboard-section">
            <div className="dashboard-section-header">
              <h2 className="dashboard-section-title">✅ My Commitments</h2>
              <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                {myCommitments.length} shifts
              </span>
            </div>
            
            <div className="upcoming-list">
              {myCommitments.slice(0, 3).map(activity => {
                const dateInfo = formatUpcomingDate(activity.date)
                const volunteersOnly = isVolunteersOnly(activity)
                
                return (
                  <button
                    key={activity.id}
                    className={`upcoming-item ${volunteersOnly ? 'volunteers-only' : ''}`}
                    onClick={() => handleActivityClick(activity)}
                  >
                    <div className="upcoming-date">
                      <div className="upcoming-date-day">{dateInfo.day}</div>
                      <div className="upcoming-date-month">{dateInfo.month}</div>
                    </div>
                    <div className="upcoming-info">
                      <div className="upcoming-title">{activity.title}</div>
                      <div className="upcoming-meta">
                        {formatTime(activity.startTime)} - {formatTime(activity.endTime)} • {activity.location}
                      </div>
                    </div>
                    <div className="upcoming-tags">
                      <span className="upcoming-tag">{activity.program}</span>
                      {volunteersOnly && <span className="upcoming-tag volunteers-only-tag">⭐ Volunteers Only</span>}
                      <span className="upcoming-tag registered">✓ Committed</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Upcoming Opportunities */}
        <div className="dashboard-section">
          <div className="dashboard-section-header">
            <h2 className="dashboard-section-title">📅 Upcoming Opportunities</h2>
            <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
              {upcomingOpportunities.length} this week
            </span>
          </div>
          
          {isLoading ? (
            <div style={{ display: 'grid', gap: '12px' }}>
              {[1, 2, 3].map(i => <ActivityCardSkeleton key={i} />)}
            </div>
          ) : error ? (
            <div style={{ background: 'var(--toast-error-bg)', padding: '16px', borderRadius: 'var(--radius-sm)', color: 'var(--toast-error-text)' }}>
              {error}
            </div>
          ) : upcomingOpportunities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--muted)' }}>
              No upcoming opportunities this week matching your filters.
            </div>
          ) : (
            <div className="upcoming-list">
              {upcomingOpportunities.map(activity => {
                const dateInfo = formatUpcomingDate(activity.date)
                const isCommitted = commitmentIds.includes(activity.id)
                const volunteersOnly = isVolunteersOnly(activity)
                
                return (
                  <button
                    key={activity.id}
                    className={`upcoming-item ${volunteersOnly ? 'volunteers-only' : ''}`}
                    onClick={() => handleActivityClick(activity)}
                  >
                    <div className="upcoming-date">
                      <div className="upcoming-date-day">{dateInfo.day}</div>
                      <div className="upcoming-date-month">{dateInfo.month}</div>
                    </div>
                    <div className="upcoming-info">
                      <div className="upcoming-title">{activity.title}</div>
                      <div className="upcoming-meta">
                        {formatTime(activity.startTime)} - {formatTime(activity.endTime)} • {activity.location}
                      </div>
                    </div>
                    <div className="upcoming-tags">
                      <span className="upcoming-tag">{activity.program}</span>
                      {volunteersOnly && <span className="upcoming-tag volunteers-only-tag">⭐ Volunteers Only</span>}
                      {isCommitted && <span className="upcoming-tag registered">✓ Committed</span>}
                      {activity.wheelchairAccessible && <span className="upcoming-tag">♿</span>}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Filters & Calendar */}
        <div className="dashboard-section">
          <div className="dashboard-section-header">
            <h2 className="dashboard-section-title">🗓️ Volunteer Calendar</h2>
            {filtersActive && (
              <button className="button ghost" onClick={resetFilters}>
                Reset filters
              </button>
            )}
          </div>
          
          <div className="filter-row">
            <input
              type="search"
              className="input"
              placeholder="Search opportunities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-chips" style={{ marginBottom: '20px' }}>
            {programOptions.map(option => (
              <button
                key={option}
                type="button"
                className={`chip ${programFilter === option ? 'active' : ''}`}
                onClick={() => setProgramFilter(option)}
              >
                {option}
              </button>
            ))}
            <button
              type="button"
              className={`chip ${accessibilityFilter ? 'active' : ''}`}
              onClick={() => setAccessibilityFilter(!accessibilityFilter)}
            >
              ♿ Accessible venues
            </button>
          </div>

          {!isLoading && !error && (
            <CalendarGrid
              activities={activities}
              filteredActivities={filteredActivities}
              onActivityClick={handleActivityClick}
            />
          )}
        </div>
      </section>

      {/* Activity Modal */}
      <ActivityModal
        activity={selectedActivity}
        onClose={() => setSelectedActivity(null)}
        onRegister={handleCommit}
        onUnregister={handleUncommit}
        isRegistered={selectedActivity ? commitmentIds.includes(selectedActivity.id) : false}
        registering={registering}
        unregistering={unregistering}
        userRole="volunteer"
      />
    </main>
  )
}
