'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ActivityCardSkeleton, StatsCardSkeleton } from '../components/Skeleton'

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

type Activity = {
  id: string
  title: string
  date: string
  time: string
  location: string
  program: string
  role: 'Participants' | 'Volunteers'
  capacity: number
  seatsLeft: number
  cadence: string
  description: string
}

export default function ParticipantPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [registeredActivities] = useState<string[]>([]) // Track registered activities
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'upcoming' | 'registered' | 'history'>('upcoming')

  useEffect(() => {
    const fetchParticipantActivities = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(`${apiBase}/api/activities?role=Participants`)
        if (response.ok) {
          const result = await response.json()
          setActivities(result.data || [])
        } else {
          throw new Error('Failed to fetch participant activities')
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load activities'
        )
        setActivities([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchParticipantActivities()
  }, [])

  const formatDate = (isoDate: string) => {
    const date = new Date(`${isoDate}T00:00:00`)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  const getPercentFull = (activity: Activity) => {
    return Math.round(((activity.capacity - activity.seatsLeft) / activity.capacity) * 100)
  }

  // Filter activities based on active tab
  const filteredActivities = activities.filter(activity => {
    if (activeTab === 'registered') {
      return registeredActivities.includes(activity.id)
    }
    // For 'upcoming' and 'history', show all for now (would filter by date in real app)
    return true
  })

  if (error) {
    return (
      <div className="container">
        <div className="status error">
          <span>{error} Ensure the backend is running at {apiBase}.</span>
          <button
            className="button"
            type="button"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      {/* Hero Section */}
      <section className="hero section-tight reveal">
        <div>
          <span className="badge">Participant Dashboard</span>
          <h1>Your activities, all in one place</h1>
          <p>
            Browse available sessions, register for activities that match your
            interests, and track your participation history.
          </p>
          <div className="hero-actions">
            <Link className="button primary" href="/calendar">
              Browse all activities
            </Link>
          </div>
        </div>
        <div className="hero-card">
          <h3>Your activity summary</h3>
          <p>
            Track your engagement and find new programs tailored to your preferences.
          </p>
          {isLoading ? (
            <div className="stat-row">
              <StatsCardSkeleton />
              <StatsCardSkeleton />
            </div>
          ) : (
            <div className="stat-row">
              <div className="stat-pill">
                <span className="stat-pill-value">{registeredActivities.length}</span>
                <span className="stat-pill-label">Registered sessions</span>
              </div>
              <div className="stat-pill">
                <span className="stat-pill-value">{activities.length}</span>
                <span className="stat-pill-label">Available now</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Stats Overview */}
      <section className="section reveal delay-1">
        <div className="stat-grid">
          <div className="stat-card">
            <span className="stat-value">{activities.length}</span>
            <span className="stat-label">Sessions available this month</span>
            <span className="stat-foot">Across all programs</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">3</span>
            <span className="stat-label">Program categories</span>
            <span className="stat-foot">Movement, Creative, Caregiver</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">0</span>
            <span className="stat-label">Sessions attended</span>
            <span className="stat-foot">This month</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">Tue</span>
            <span className="stat-label">Most active day</span>
            <span className="stat-foot">Based on availability</span>
          </div>
        </div>
      </section>

      {/* Activity Tabs */}
      <section className="section reveal delay-2">
        <div className="section-heading">
          <span className="section-eyebrow">Your sessions</span>
          <h2 className="section-title">Manage your activities</h2>
        </div>
        
        <div className="toggle-group" style={{ marginBottom: '24px' }}>
          <button 
            className={`toggle-button ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            Available
          </button>
          <button 
            className={`toggle-button ${activeTab === 'registered' ? 'active' : ''}`}
            onClick={() => setActiveTab('registered')}
          >
            Registered
          </button>
          <button 
            className={`toggle-button ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            History
          </button>
        </div>

        {isLoading ? (
          <div className="calendar-month-grid">
            <div className="day-panel">
              <div className="day-cards">
                <ActivityCardSkeleton />
                <ActivityCardSkeleton />
              </div>
            </div>
            <div className="day-panel">
              <div className="day-cards">
                <ActivityCardSkeleton />
              </div>
            </div>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📋</span>
            <strong>
              {activeTab === 'registered' 
                ? "No registered activities yet" 
                : activeTab === 'history'
                ? "No activity history"
                : "No activities available"
              }
            </strong>
            <span>
              {activeTab === 'registered' 
                ? "Browse available sessions and register for ones that interest you."
                : activeTab === 'history'
                ? "Your completed sessions will appear here."
                : "Check back later for new sessions."
              }
            </span>
            {activeTab === 'registered' && (
              <button 
                className="button primary" 
                onClick={() => setActiveTab('upcoming')}
              >
                Browse available sessions
              </button>
            )}
          </div>
        ) : (
          <div className="match-grid">
            {filteredActivities.map((activity) => (
              <article key={activity.id} className="match-card">
                <div className="match-header">
                  <span className="activity-time">{activity.time}</span>
                  <span className="role-pill" data-variant="Participants">
                    Participant
                  </span>
                </div>
                <h3>{activity.title}</h3>
                <p className="match-meta">{formatDate(activity.date)} · {activity.location}</p>
                <div className="activity-tags">
                  <span className="activity-tag" data-variant={activity.program}>
                    {activity.program}
                  </span>
                  <span className="activity-tag" data-variant={activity.cadence}>
                    {activity.cadence}
                  </span>
                </div>
                <div className="activity-progress">
                  <div className="meter">
                    <span style={{ width: `${getPercentFull(activity)}%` }} />
                  </div>
                  <span className="activity-availability">
                    {activity.seatsLeft} of {activity.capacity} spots available
                  </span>
                </div>
                <div className="activity-footer">
                  <Link className="button" href={`/activity/${activity.id}`}>
                    View details
                  </Link>
                  {activity.seatsLeft > 0 && !registeredActivities.includes(activity.id) && (
                    <button className="button primary">
                      Register
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Preferences Section */}
      <section className="detail-grid reveal delay-2">
        <div className="detail-card">
          <h2>Your preferences</h2>
          <p className="detail-subtitle">
            Help us match you with the right activities.
          </p>
          <div className="form">
            <label className="form-field">
              <span className="form-label">Preferred program type</span>
              <select className="input">
                <option>All programs</option>
                <option>Movement</option>
                <option>Creative</option>
                <option>Caregiver sessions</option>
              </select>
            </label>
            <div className="form-row">
              <label className="checkbox-field">
                <input type="checkbox" defaultChecked />
                <span>Morning sessions</span>
              </label>
              <label className="checkbox-field">
                <input type="checkbox" defaultChecked />
                <span>Afternoon sessions</span>
              </label>
            </div>
            <label className="form-field">
              <span className="form-label">Accessibility needs</span>
              <textarea 
                className="input" 
                rows={3}
                placeholder="Let us know if you need any accommodations..."
              />
            </label>
            <button className="button primary" type="button">
              Save preferences
            </button>
          </div>
        </div>
        <div className="detail-card">
          <h2>Quick actions</h2>
          <p className="detail-subtitle">
            Common tasks and shortcuts.
          </p>
          <div className="detail-stack">
            <Link href="/calendar" className="detail-action">
              <span className="detail-action-icon">📅</span>
              <div>
                <strong>View full calendar</strong>
                <span>See all available sessions</span>
              </div>
            </Link>
            <div className="detail-action">
              <span className="detail-action-icon">📧</span>
              <div>
                <strong>Email reminders</strong>
                <span>Get notified about upcoming sessions</span>
              </div>
            </div>
            <div className="detail-action">
              <span className="detail-action-icon">📊</span>
              <div>
                <strong>Activity report</strong>
                <span>Download your participation history</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="callout reveal delay-2">
        <h2>Ready to try a new activity?</h2>
        <p>
          Explore the full calendar to find sessions that match your schedule
          and interests.
        </p>
        <div className="callout-actions">
          <Link className="button primary" href="/calendar">
            Browse calendar
          </Link>
          <Link className="button ghost" href="/admin">
            Need help?
          </Link>
        </div>
      </section>
    </div>
  )
}
