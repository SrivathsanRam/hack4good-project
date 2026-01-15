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
  const [cadenceFilter, setCadenceFilter] = useState('All cadences')
  const [searchTerm, setSearchTerm] = useState('')
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
  const cadenceOptions = ['All cadences', 'Ad hoc', 'Weekly', 'Twice weekly']

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

  const summaryStats = useMemo(() => {
    const participantSessions = activities.filter(
      (activity) => activity.role === 'Participants'
    ).length
    const volunteerSessions = activities.filter(
      (activity) => activity.role === 'Volunteers'
    ).length
    const uniqueDays = new Set(activities.map((activity) => activity.date)).size

    return {
      total: activities.length,
      participantSessions,
      volunteerSessions,
      uniqueDays,
    }
  }, [activities])

  const filtersActive =
    searchTerm.trim().length > 0 ||
    programFilter !== 'All programs' ||
    roleFilter !== 'All roles' ||
    cadenceFilter !== 'All cadences'

  const resetFilters = () => {
    setProgramFilter('All programs')
    setRoleFilter('All roles')
    setCadenceFilter('All cadences')
    setSearchTerm('')
  }

  const filteredActivities = useMemo(() => {
    const searchLower = searchTerm.trim().toLowerCase()

    return activities.filter((activity) => {
      const matchesProgram =
        programFilter === 'All programs' || activity.program === programFilter
      const matchesRole = roleFilter === 'All roles' || activity.role === roleFilter
      const matchesCadence =
        cadenceFilter === 'All cadences' || activity.cadence === cadenceFilter
      const matchesSearch =
        !searchLower ||
        [activity.title, activity.location, activity.program, activity.cadence]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(searchLower))

      return matchesProgram && matchesRole && matchesCadence && matchesSearch
    })
  }, [activities, cadenceFilter, programFilter, roleFilter, searchTerm])

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

  const getSeatFill = (activity: Activity) => {
    if (!activity.capacity) {
      return 0
    }
    const used = Math.max(activity.capacity - activity.seatsLeft, 0)
    return Math.min(used / activity.capacity, 1)
  }

  const renderActivityCard = (activity: Activity) => {
    const seatFill = Math.round(getSeatFill(activity) * 100)

    return (
      <article key={activity.id} className="activity-card">
        <div className="activity-header">
          <div>
            <span className="activity-time">{activity.time}</span>
            <h3>{activity.title}</h3>
            <p className="activity-meta">{activity.location}</p>
          </div>
          <span className="role-pill" data-variant={activity.role}>
            {activity.role}
          </span>
        </div>
        <div className="activity-tags">
          <span className="activity-tag" data-variant={activity.program}>
            {activity.program}
          </span>
          <span className="activity-tag" data-variant={activity.cadence}>
            {activity.cadence}
          </span>
        </div>
        <div className="activity-progress">
          <div
            className="meter"
            role="progressbar"
            aria-valuenow={seatFill}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span style={{ width: `${seatFill}%` }} />
          </div>
          <span className="activity-capacity">
            {activity.seatsLeft} of {activity.capacity} seats left
          </span>
        </div>
        <div className="activity-footer">
          <span className="activity-availability">{activity.cadence}</span>
          <Link href={`/activity/${activity.id}`} className="button">
            View details
          </Link>
        </div>
      </article>
    )
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
          <h3>Schedule pulse</h3>
          <p>Track how many sessions are live across programs.</p>
          <div className="stat-row">
            <div className="stat-pill">
              <span className="stat-pill-value">{summaryStats.total}</span>
              <span className="stat-pill-label">Sessions</span>
            </div>
            <div className="stat-pill">
              <span className="stat-pill-value">
                {summaryStats.participantSessions}
              </span>
              <span className="stat-pill-label">Participant</span>
            </div>
            <div className="stat-pill">
              <span className="stat-pill-value">
                {summaryStats.volunteerSessions}
              </span>
              <span className="stat-pill-label">Volunteer</span>
            </div>
            <div className="stat-pill">
              <span className="stat-pill-value">{summaryStats.uniqueDays}</span>
              <span className="stat-pill-label">Days</span>
            </div>
          </div>
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
          <div className="toolbar-left">
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
          <div className="toolbar-actions">
            <button
              className="button ghost"
              type="button"
              onClick={resetFilters}
              disabled={!filtersActive}
            >
              Reset filters
            </button>
          </div>
        </div>

        <div className="filter-panel">
          <label className="search-field">
            <span className="form-label">Search</span>
            <input
              className="input"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by title, location, or program"
            />
          </label>
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
        <div className="filters">
          <span className="filter-label">Cadence</span>
          {cadenceOptions.map((option) => (
            <button
              key={option}
              type="button"
              className={`chip ${cadenceFilter === option ? 'active' : ''}`}
              onClick={() => setCadenceFilter(option)}
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
            {filtersActive && (
              <button className="button" type="button" onClick={resetFilters}>
                Reset filters
              </button>
            )}
          </div>
        ) : viewMode === 'Month' ? (
          <div className="calendar-month-grid">
            {groupedByDate.map(([date, items]) => (
              <div key={date} className="day-panel">
                <div className="day-title">
                  {formatDay(date)}
                  <span className="day-count">{items.length} sessions</span>
                </div>
                <div className="day-cards">
                  {items.map((activity) => renderActivityCard(activity))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="calendar-week-list">
            {groupedByDate.map(([date, items]) => (
              <div key={date} className="week-row">
                <div className="day-title">
                  {formatDay(date)}
                  <span className="day-count">{items.length} sessions</span>
                </div>
                <div className="week-cards">
                  {items.map((activity) => renderActivityCard(activity))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
