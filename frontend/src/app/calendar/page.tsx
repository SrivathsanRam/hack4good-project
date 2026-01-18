'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

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

type DateRangeOption = 'All' | 'Next 7 days' | 'Next 30 days'

export default function CalendarPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'Month' | 'Week'>('Month')
  const [programFilter, setProgramFilter] = useState('All programs')
  const [roleFilter, setRoleFilter] = useState('All roles')
  const [cadenceFilter, setCadenceFilter] = useState('All cadences')
  const [dateRange, setDateRange] = useState<DateRangeOption>('All')
  const [searchTerm, setSearchTerm] = useState('')

  const programOptions = [
    'All programs',
    'Movement',
    'Creative',
    'Caregiver sessions',
  ]
  const roleOptions = ['All roles', 'Participants', 'Volunteers']
  const cadenceOptions = ['All cadences', 'Ad hoc', 'Weekly', 'Twice weekly']
  const dateRangeOptions: DateRangeOption[] = ['All', 'Next 7 days', 'Next 30 days']

  // Fetch activities from API
  useEffect(() => {
    const fetchActivities = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(`${apiBase}/api/activities`)
        if (!response.ok) {
          throw new Error('Failed to fetch activities')
        }
        const result = await response.json()
        setActivities(result.data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load activities')
      } finally {
        setIsLoading(false)
      }
    }
    fetchActivities()
  }, [])

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
    cadenceFilter !== 'All cadences' ||
    dateRange !== 'All'

  const resetFilters = () => {
    setProgramFilter('All programs')
    setRoleFilter('All roles')
    setCadenceFilter('All cadences')
    setDateRange('All')
    setSearchTerm('')
  }

  const filteredActivities = useMemo(() => {
    const searchLower = searchTerm.trim().toLowerCase()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const rangeDays =
      dateRange === 'Next 7 days' ? 7 : dateRange === 'Next 30 days' ? 30 : null

    return activities.filter((activity) => {
      const matchesProgram =
        programFilter === 'All programs' || activity.program === programFilter
      const matchesRole = roleFilter === 'All roles' || activity.role === roleFilter
      const matchesCadence =
        cadenceFilter === 'All cadences' || activity.cadence === cadenceFilter
      const matchesDate =
        rangeDays === null
          ? true
          : (() => {
              const activityDate = new Date(`${activity.date}T00:00:00`)
              const diffDays =
                (activityDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
              return diffDays >= 0 && diffDays <= rangeDays
            })()
      const matchesSearch =
        !searchLower ||
        [activity.title, activity.location, activity.program, activity.cadence]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(searchLower))

      return (
        matchesProgram &&
        matchesRole &&
        matchesCadence &&
        matchesSearch &&
        matchesDate
      )
    })
  }, [
    activities,
    cadenceFilter,
    dateRange,
    programFilter,
    roleFilter,
    searchTerm,
  ])

  const openSeats = useMemo(() => {
    return filteredActivities.reduce(
      (total, activity) => total + Math.max(activity.seatsLeft, 0),
      0
    )
  }, [filteredActivities])

  const lowCapacityCount = useMemo(() => {
    return filteredActivities.filter(
      (activity) => activity.seatsLeft > 0 && activity.seatsLeft <= 2
    ).length
  }, [filteredActivities])

  const uniqueDays = useMemo(() => {
    return new Set(filteredActivities.map((activity) => activity.date)).size
  }, [filteredActivities])

  const nextActivity = useMemo(() => {
    const sorted = [...filteredActivities].sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time || '00:00'}`)
      const dateB = new Date(`${b.date}T${b.time || '00:00'}`)
      return dateA.getTime() - dateB.getTime()
    })
    return sorted[0]
  }, [filteredActivities])

  const matchRate =
    activities.length > 0
      ? Math.round((filteredActivities.length / activities.length) * 100)
      : 0

  const programSummary = useMemo(() => {
    const programLabels = ['Movement', 'Creative', 'Caregiver sessions']
    const counts = programLabels.map((program) => ({
      label: program,
      count: filteredActivities.filter(
        (activity) => activity.program === program
      ).length,
    }))
    const total = counts.reduce((sum, item) => sum + item.count, 0)
    return counts.map((item) => ({
      ...item,
      percent: total > 0 ? Math.round((item.count / total) * 100) : 0,
    }))
  }, [filteredActivities])

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
    const isFull = activity.seatsLeft <= 0
    const isLow = activity.seatsLeft > 0 && activity.seatsLeft <= 2
    const availabilityLabel = isFull
      ? 'Full'
      : isLow
        ? 'Low seats'
        : `${activity.seatsLeft} seats left`

    return (
      <article key={activity.id} className="activity-card">
        <div className="activity-header">
          <div>
            <span className="activity-time">{activity.time}</span>
            <h3>{activity.title}</h3>
            <p className="activity-meta">{activity.location}</p>
          </div>
          <div className="activity-side">
            <span className="role-pill" data-variant={activity.role}>
              {activity.role}
            </span>
            {(isLow || isFull) && (
              <span
                className="alert-pill"
                data-variant={isFull ? 'full' : 'low'}
              >
                {availabilityLabel}
              </span>
            )}
          </div>
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
          <span className="activity-availability">{availabilityLabel}</span>
          <Link href={`/activity/${activity.id}`} className="button">
            View details
          </Link>
        </div>
      </article>
    )
  }

  const statusLabel = isLoading ? 'Loading...' : `${filteredActivities.length} sessions matched`

  if (isLoading) {
    return (
      <div className="container">
        <div className="status loading">
          <span className="spinner" aria-hidden="true" />
          Loading activities...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <div className="status error">
          {error}
          <button className="button" type="button" onClick={() => window.location.reload()}>
            Try again
          </button>
        </div>
      </div>
    )
  }

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

      <section className="section reveal delay-1">
        <div className="section-heading">
          <span className="section-eyebrow">Insights</span>
          <h2 className="section-title">Calendar focus</h2>
          <p className="section-subtitle">
            See what is coming up and where there is still availability.
          </p>
        </div>
        <div className="insight-grid">
          <div className="insight-card">
            <span className="insight-title">Next session</span>
            <span className="insight-value">
              {nextActivity ? formatDay(nextActivity.date) : 'No sessions'}
            </span>
            <span className="insight-meta">
              {nextActivity
                ? `${nextActivity.title} at ${nextActivity.time}`
                : 'Add a session to get started.'}
            </span>
          </div>
          <div className="insight-card">
            <span className="insight-title">Open seats</span>
            <span className="insight-value">{openSeats}</span>
            <span className="insight-meta">
              {lowCapacityCount} sessions are close to full.
            </span>
          </div>
          <div className="insight-card">
            <span className="insight-title">Filters applied</span>
            <span className="insight-value">{matchRate}%</span>
            <span className="insight-meta">
              {filteredActivities.length} of {activities.length} sessions matched.
            </span>
          </div>
          <div className="insight-card">
            <span className="insight-title">Program mix</span>
            {filteredActivities.length === 0 ? (
              <span className="insight-meta">No sessions to analyze yet.</span>
            ) : (
              <div className="mini-chart">
                {programSummary.map((item) => (
                  <div key={item.label} className="chart-row">
                    <span className="chart-label">{item.label}</span>
                    <div className="chart-bar">
                      <span style={{ width: `${item.percent}%` }} />
                    </div>
                    <span className="chart-value">{item.count}</span>
                  </div>
                ))}
              </div>
            )}
            <span className="insight-meta">{uniqueDays} days scheduled.</span>
          </div>
        </div>
      </section>

      <section className="reveal delay-1">
        <div className="calendar-controls">
          <div className="toolbar">
            <div className="toolbar-left">
              <div
                className="toggle-group"
                role="tablist"
                aria-label="Calendar view"
              >
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
            <span className="filter-label">Date range</span>
            {dateRangeOptions.map((option) => (
              <button
                key={option}
                type="button"
                className={`chip ${dateRange === option ? 'active' : ''}`}
                onClick={() => setDateRange(option)}
              >
                {option}
              </button>
            ))}
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
        </div>

        {filteredActivities.length === 0 ? (
          <div className="empty-state">
            <strong>No activities match those filters</strong>
            <span>Try switching date range, program, role, or cadence.</span>
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

      <section className="callout reveal delay-2">
        <h2>Need to make schedule changes?</h2>
        <p>
          Jump into the staff console to add sessions, adjust capacity, or track
          attendance updates.
        </p>
        <div className="callout-actions">
          <Link className="button primary" href="/admin">
            Open staff console
          </Link>
          <Link className="button ghost" href="/volunteer">
            Volunteer view
          </Link>
        </div>
      </section>
    </div>
  )
}
