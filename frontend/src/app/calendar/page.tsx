'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

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
}

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<'Month' | 'Week'>('Month')
  const [programFilter, setProgramFilter] = useState('All programs')
  const [roleFilter, setRoleFilter] = useState('All roles')
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const programOptions = [
    'All programs',
    'Movement',
    'Creative',
    'Caregiver sessions',
  ]
  const roleOptions = ['All roles', 'Participants', 'Volunteers']

  useEffect(() => {
    let isActive = true

    const loadActivities = async () => {
      setIsLoading(true)
      setError(null)
      setActivities([])

      try {
        const response = await fetch(`${apiBase}/api/activities`)
        if (!response.ok) {
          throw new Error('Unable to load schedule. Please try again.')
        }
        const payload = await response.json()
        const data = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.items)
            ? payload.items
            : []

        if (isActive) {
          setActivities(data)
        }
      } catch (loadError) {
        if (isActive) {
          const message =
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load schedule. Please try again.'
          setError(message)
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadActivities()

    return () => {
      isActive = false
    }
  }, [apiBase, refreshKey])

  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      const matchesProgram =
        programFilter === 'All programs' || activity.program === programFilter
      const matchesRole = roleFilter === 'All roles' || activity.role === roleFilter
      return matchesProgram && matchesRole
    })
  }, [activities, programFilter, roleFilter])

  const groupedByDate = useMemo(() => {
    const groups = new Map<string, Activity[]>()
    for (const activity of filteredActivities) {
      const group = groups.get(activity.date)
      if (group) {
        group.push(activity)
      } else {
        groups.set(activity.date, [activity])
      }
    }
    return Array.from(groups.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    )
  }, [filteredActivities])

  const formatDay = (isoDate: string) => {
    const date = new Date(`${isoDate}T00:00:00`)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  const statusLabel = isLoading
    ? 'Loading schedule...'
    : `${filteredActivities.length} activities matched`

  return (
    <div className="container">
      <section className="hero section-tight reveal">
        <div>
          <span className="badge">Calendar view</span>
          <h1>Unified activity schedule</h1>
          <p>
            Filter by program, role, or cadence to see the sessions that matter
            most.
          </p>
        </div>
        <div className="hero-card">
          <h3>Quick actions</h3>
          <p>Manage schedule visibility and registrations.</p>
          <div className="hero-actions">
            <Link className="button" href="/admin">
              Add activity
            </Link>
            <Link className="button primary" href="/volunteer">
              Volunteer view
            </Link>
          </div>
        </div>
      </section>

      <section className="reveal delay-1">
        <div className="toolbar">
          <div className="toggle-group" role="tablist" aria-label="Calendar view">
            {(['Month', 'Week'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                className={`toggle-button ${viewMode === mode ? 'active' : ''}`}
                onClick={() => setViewMode(mode)}
              >
                {mode} view
              </button>
            ))}
          </div>
          <span className="toolbar-note">{statusLabel}</span>
        </div>

        <div className="filters">
          <span className="filter-label">Program</span>
          {programOptions.map((option) => (
            <button
              key={option}
              type="button"
              className={`chip ${programFilter === option ? 'active' : ''}`}
              onClick={() => setProgramFilter(option)}
            >
              {option}
            </button>
          ))}
        </div>
        <div className="filters">
          <span className="filter-label">Role</span>
          {roleOptions.map((option) => (
            <button
              key={option}
              type="button"
              className={`chip ${roleFilter === option ? 'active' : ''}`}
              onClick={() => setRoleFilter(option)}
            >
              {option}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="status loading">
            <span className="spinner" aria-hidden="true" />
            Loading schedule from the API...
          </div>
        ) : error ? (
          <div className="status error">
            {error}
            <button
              className="button"
              type="button"
              onClick={() => setRefreshKey((value) => value + 1)}
            >
              Try again
            </button>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="empty-state">
            <strong>No activities match those filters</strong>
            <span>Try switching to another program or role.</span>
          </div>
        ) : viewMode === 'Month' ? (
          <div className="calendar-month-grid">
            {groupedByDate.map(([date, items]) => (
              <div key={date} className="day-panel">
                <div className="day-title">{formatDay(date)}</div>
                <div className="day-cards">
                  {items.map((activity) => (
                    <article key={activity.id} className="activity-card">
                      <div>
                        <h3>{activity.title}</h3>
                        <p className="activity-meta">
                          {activity.time} - {activity.location}
                        </p>
                      </div>
                      <div className="activity-tags">
                        <span className="activity-tag">{activity.program}</span>
                        <span className="activity-tag">{activity.role}</span>
                        <span className="activity-tag">{activity.cadence}</span>
                      </div>
                      <div className="activity-footer">
                        <span>{activity.seatsLeft} seats left</span>
                        <Link
                          href={`/activity/${activity.id}`}
                          className="button"
                        >
                          View details
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="calendar-week-list">
            {groupedByDate.map(([date, items]) => (
              <div key={date} className="week-row">
                <div className="day-title">{formatDay(date)}</div>
                <div className="week-cards">
                  {items.map((activity) => (
                    <article key={activity.id} className="activity-card">
                      <div>
                        <h3>{activity.title}</h3>
                        <p className="activity-meta">
                          {activity.time} - {activity.location}
                        </p>
                      </div>
                      <div className="activity-tags">
                        <span className="activity-tag">{activity.program}</span>
                        <span className="activity-tag">{activity.role}</span>
                      </div>
                      <div className="activity-footer">
                        <span>{activity.seatsLeft} seats left</span>
                        <Link
                          href={`/activity/${activity.id}`}
                          className="button"
                        >
                          View details
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
