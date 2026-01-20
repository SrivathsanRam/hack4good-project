'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { ActivityCardSkeleton } from '../../components/Skeleton'
import CalendarGrid from '../../components/CalendarGrid'
import ActivityModal from '../../components/ActivityModal'
import NotificationBell from '../../components/NotificationBell'
import { Activity } from '../../components/ActivityCard'

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

const programOptions = ['All programs', 'Movement', 'Creative', 'Caregiver sessions']

export default function ParticipantDashboard() {
  const router = useRouter()
  const { user, logout, isLoading: authLoading } = useAuth()
  
  const [activities, setActivities] = useState<Activity[]>([])
  const [registeredIds, setRegisteredIds] = useState<string[]>([])
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
  const [freeOnlyFilter, setFreeOnlyFilter] = useState(false)

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
          fetch(`${apiBase}/api/activities?role=Participant`),
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
      const matchesFree = !freeOnlyFilter || !activity.paymentRequired
      
      return matchesProgram && matchesSearch && matchesAccessibility && matchesFree
    })
  }, [activities, programFilter, searchTerm, accessibilityFilter, freeOnlyFilter])

  // Upcoming activities (next 7 days)
  const upcomingActivities = useMemo(() => {
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

  // My registered activities (for timing clash detection)
  const registeredActivities = useMemo(() => {
    return activities.filter(a => registeredIds.includes(a.id))
  }, [activities, registeredIds])

  // Recommended activities based on preferences and membership
  const recommendedActivities = useMemo(() => {
    if (!user) return []
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    
    // Filter to this month's activities that user hasn't registered for
    const availableThisMonth = activities.filter(a => {
      const actDate = new Date(`${a.date}T00:00:00`)
      return actDate >= today && actDate <= endOfMonth && !registeredIds.includes(a.id)
    })
    
    // Score each activity based on preferences and membership
    const scored = availableThisMonth.map(activity => {
      let score = 0
      
      // Preference matching: +10 points for matching program
      if (user.preferences?.includes(activity.program)) {
        score += 10
      }
      
      // Accessibility: +5 points if user needs it and activity has it
      const needsAccessibility = user.mobilityStatus === 'cannot walk' || user.mobilityStatus === 'cannot walk long distances'
      if (needsAccessibility && activity.wheelchairAccessible) {
        score += 5
      } else if (needsAccessibility && !activity.wheelchairAccessible) {
        score -= 100 // Exclude inaccessible activities
      }
      
      // Free activities get a small boost
      if (!activity.paymentRequired) {
        score += 2
      }
      
      // Seats available boost
      const seatsLeft = activity.participantSeatsLeft ?? activity.seatsLeft ?? 0
      if (seatsLeft > 5) {
        score += 3
      } else if (seatsLeft <= 0) {
        score -= 100 // Exclude full activities
      }
      
      return { activity, score }
    })
    
    // Filter out negative scores (inaccessible or full) and sort by score
    const filtered = scored
      .filter(s => s.score > -50)
      .sort((a, b) => b.score - a.score)
      .map(s => s.activity)
    
    // Determine how many to recommend based on membership
    let targetCount = 1
    switch (user.membership) {
      case 'Weekly':
        targetCount = 4 // ~1 per week
        break
      case 'Twice weekly':
        targetCount = 8 // ~2 per week
        break
      case 'Three or more':
        targetCount = 12 // ~3 per week
        break
      case 'Ad hoc':
      default:
        targetCount = 3 // A few suggestions
    }
    
    // Spread recommendations across different dates
    const dateMap = new Map<string, number>()
    const recommendations: Activity[] = []
    
    for (const activity of filtered) {
      if (recommendations.length >= targetCount) break
      
      const dateCount = dateMap.get(activity.date) || 0
      // Limit 1-2 activities per day depending on membership
      const maxPerDay = user.membership === 'Three or more' ? 2 : 1
      
      if (dateCount < maxPerDay) {
        recommendations.push(activity)
        dateMap.set(activity.date, dateCount + 1)
      }
    }
    
    return recommendations.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [activities, registeredIds, user])

  const handleActivityClick = (activity: Activity) => {
    setSelectedActivity(activity)
  }

  const handleRegister = async (activity: Activity) => {
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
          role: 'Participant',
          membership: user.membership || 'Ad hoc',
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Registration failed')
      }
      
      setRegisteredIds(prev => [...prev, activity.id])
      setSelectedActivity(null)
    } catch (err) {
      console.error('Registration error:', err)
      alert(err instanceof Error ? err.message : 'Failed to register')
    } finally {
      setRegistering(false)
    }
  }

  const handleUnregister = async (activity: Activity) => {
    if (!user) return
    
    setUnregistering(true)
    try {
      const response = await fetch(
        `${apiBase}/api/registrations/by-activity/${activity.id}?email=${encodeURIComponent(user.email)}`,
        { method: 'DELETE' }
      )
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to unregister')
      }
      
      setRegisteredIds(prev => prev.filter(id => id !== activity.id))
      setSelectedActivity(null)
    } catch (err) {
      console.error('Unregister error:', err)
      alert(err instanceof Error ? err.message : 'Failed to unregister')
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

  const filtersActive = programFilter !== 'All programs' || searchTerm.trim() !== '' || accessibilityFilter || freeOnlyFilter

  const resetFilters = () => {
    setProgramFilter('All programs')
    setSearchTerm('')
    setAccessibilityFilter(false)
    setFreeOnlyFilter(false)
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
            <h1 className="dashboard-title">Welcome back, {user.name}! 👋</h1>
            <p className="dashboard-subtitle">
              {user.membership} member • {user.mobilityStatus}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <NotificationBell 
              userEmail={user.email} 
              userId={user.id}
              onActivityClick={(activityId) => {
                const activity = activities.find(a => a.id === activityId)
                if (activity) setSelectedActivity(activity)
              }}
            />
            <button onClick={handleLogout} className="button outline">
              Sign Out
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="dashboard-stats">
          <div className="stat-box">
            <div className="stat-box-label">Registered Activities</div>
            <div className="stat-box-value">{registeredIds.length}</div>
          </div>
          <div className="stat-box">
            <div className="stat-box-label">Available This Week</div>
            <div className="stat-box-value">{upcomingActivities.length}</div>
          </div>
          <div className="stat-box">
            <div className="stat-box-label">Total Activities</div>
            <div className="stat-box-value">{activities.length}</div>
          </div>
          <div className="stat-box">
            <div className="stat-box-label">Your Preferences</div>
            <div style={{ fontSize: '0.9rem' }}>
              {user.preferences?.length ? user.preferences.join(', ') : 'None set'}
            </div>
          </div>
        </div>

        {/* My Activities - Registered */}
        {registeredActivities.length > 0 && (
          <div className="dashboard-section">
            <div className="dashboard-section-header">
              <h2 className="dashboard-section-title">✅ My Activities</h2>
              <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                {registeredActivities.length} registered
              </span>
            </div>
            
            <div className="upcoming-list">
              {registeredActivities
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .slice(0, 5)
                .map(activity => {
                  const dateInfo = formatUpcomingDate(activity.date)
                  
                  return (
                    <button
                      key={activity.id}
                      className="upcoming-item"
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
                        <span className="upcoming-tag registered">✓ Registered</span>
                        {activity.wheelchairAccessible && <span className="upcoming-tag">♿</span>}
                      </div>
                    </button>
                  )
                })}
              {registeredActivities.length > 5 && (
                <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '8px', fontSize: '0.9rem' }}>
                  + {registeredActivities.length - 5} more registered activities
                </p>
              )}
            </div>
          </div>
        )}

        {/* Recommended Activities */}
        {recommendedActivities.length > 0 && (
          <div className="dashboard-section recommended-section">
            <div className="dashboard-section-header">
              <h2 className="dashboard-section-title">⭐ Recommended For You</h2>
              <span style={{ color: '#92400e', fontSize: '0.9rem', fontWeight: 500 }}>
                Based on your {user.membership?.toLowerCase() || 'ad hoc'} commitment
              </span>
            </div>
            <p style={{ color: '#b45309', fontSize: '0.85rem', marginBottom: '16px' }}>
              Activities matching your preferences: {user.preferences?.length ? user.preferences.join(', ') : 'All programs'}
            </p>
            
            <div className="upcoming-list">
              {recommendedActivities.slice(0, 6).map(activity => {
                const dateInfo = formatUpcomingDate(activity.date)
                const matchesPreference = user.preferences?.includes(activity.program)
                
                return (
                  <button
                    key={activity.id}
                    className="upcoming-item recommended"
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
                      {matchesPreference && <span className="upcoming-tag match">★ Matches preferences</span>}
                      {activity.wheelchairAccessible && <span className="upcoming-tag">♿</span>}
                      {!activity.paymentRequired && <span className="upcoming-tag free">Free</span>}
                    </div>
                  </button>
                )
              })}
              {recommendedActivities.length > 6 && (
                <p style={{ textAlign: 'center', color: 'var(--muted)', padding: '8px', fontSize: '0.9rem' }}>
                  + {recommendedActivities.length - 6} more recommendations
                </p>
              )}
            </div>
          </div>
        )}

        {/* Upcoming Activities */}
        <div className="dashboard-section">
          <div className="dashboard-section-header">
            <h2 className="dashboard-section-title">📅 Upcoming This Week</h2>
            <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
              {upcomingActivities.length} activities
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
          ) : upcomingActivities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--muted)' }}>
              No upcoming activities this week matching your filters.
            </div>
          ) : (
            <div className="upcoming-list">
              {upcomingActivities.map(activity => {
                const dateInfo = formatUpcomingDate(activity.date)
                const isRegistered = registeredIds.includes(activity.id)
                
                return (
                  <button
                    key={activity.id}
                    className="upcoming-item"
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
                      {isRegistered && <span className="upcoming-tag registered">✓ Registered</span>}
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
            <h2 className="dashboard-section-title">🗓️ Activity Calendar</h2>
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
              placeholder="Search activities..."
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
              ♿ Accessible
            </button>
            <button
              type="button"
              className={`chip ${freeOnlyFilter ? 'active' : ''}`}
              onClick={() => setFreeOnlyFilter(!freeOnlyFilter)}
            >
              Free only
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
        onRegister={handleRegister}
        onUnregister={handleUnregister}
        isRegistered={selectedActivity ? registeredIds.includes(selectedActivity.id) : false}
        registering={registering}
        unregistering={unregistering}
        userRole="participant"
        userHomeCoordinates={user.homeCoordinates}
        userMobilityStatus={user.mobilityStatus}
        registeredActivities={registeredActivities}
      />
    </main>
  )
}
