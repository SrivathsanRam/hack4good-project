'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import CalendarGrid from '../components/CalendarGrid'
import ActivityCard, { Activity } from '../components/ActivityCard'

const programOptions = ['All programs', 'Movement', 'Creative', 'Caregiver sessions']
const roleOptions = ['All roles', 'Participant', 'Volunteer']
const typeOptions = ['All types', 'Weekly', 'Fortnightly', 'Monthly', 'One-off']
const dateRangeOptions = ['All dates', 'Next 7 days', 'Next 30 days']

type ViewMode = 'Calendar' | 'List'

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('Calendar')
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [programFilter, setProgramFilter] = useState('All programs')
  const [roleFilter, setRoleFilter] = useState('All roles')
  const [typeFilter, setTypeFilter] = useState('All types')
  const [dateRange, setDateRange] = useState('All dates')
  const [searchTerm, setSearchTerm] = useState('')
  const [accessibilityFilter, setAccessibilityFilter] = useState(false)
  const [freeOnlyFilter, setFreeOnlyFilter] = useState(false)

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/activities')
        if (!response.ok) throw new Error('Failed to fetch activities')
        const result = await response.json()
        setActivities(result.data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred')
      } finally {
        setIsLoading(false)
      }
    }
    fetchActivities()
  }, [])

  const filtersActive =
    programFilter !== 'All programs' ||
    roleFilter !== 'All roles' ||
    typeFilter !== 'All types' ||
    dateRange !== 'All dates' ||
    searchTerm.trim() !== '' ||
    accessibilityFilter ||
    freeOnlyFilter

  // Filter out "Volunteers Only" activities - they should only appear on /volunteer page
  const publicActivities = useMemo(() => {
    return activities.filter(activity => {
      const activityRoles = activity.roles || (activity.role ? [activity.role] : [])
      return !activityRoles.includes('Volunteers Only')
    })
  }, [activities])

  const resetFilters = () => {
    setProgramFilter('All programs')
    setRoleFilter('All roles')
    setTypeFilter('All types')
    setDateRange('All dates')
    setSearchTerm('')
    setAccessibilityFilter(false)
    setFreeOnlyFilter(false)
  }

  const summaryStats = useMemo(() => {
    const total = publicActivities.length
    // Support both old role field and new roles array
    const participantSessions = publicActivities.filter(a => 
      a.roles?.includes('Participant') || a.role === 'Participant'
    ).length
    const volunteerSessions = publicActivities.filter(a => 
      a.roles?.includes('Volunteer') || a.role === 'Volunteer'
    ).length
    const uniqueDays = new Set(publicActivities.map(a => a.date)).size
    return { total, participantSessions, volunteerSessions, uniqueDays }
  }, [publicActivities])

  const filteredActivities = useMemo(() => {
    const searchLower = searchTerm.toLowerCase().trim()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const rangeDays =
      dateRange === 'Next 7 days' ? 7 : dateRange === 'Next 30 days' ? 30 : null

    return publicActivities.filter((activity) => {
      const activityRoles = activity.roles || (activity.role ? [activity.role] : [])

      const matchesProgram =
        programFilter === 'All programs' || activity.program === programFilter
      // Support both old role field and new roles array
      const matchesRole = roleFilter === 'All roles' || activityRoles.includes(roleFilter)
      // Support both old cadence field and new type field
      const activityType = activity.type || activity.cadence || ''
      const matchesType =
        typeFilter === 'All types' || activityType === typeFilter
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
        [activity.title, activity.location, activity.program, activityType]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(searchLower))
      const matchesAccessibility =
        !accessibilityFilter || activity.wheelchairAccessible
      const matchesFree =
        !freeOnlyFilter || !activity.paymentRequired

      return (
        matchesProgram &&
        matchesRole &&
        matchesType &&
        matchesSearch &&
        matchesDate &&
        matchesAccessibility &&
        matchesFree
      )
    })
  }, [
    activities,
    typeFilter,
    dateRange,
    programFilter,
    roleFilter,
    searchTerm,
    accessibilityFilter,
    freeOnlyFilter,
  ])

  const openSeats = useMemo(() => {
    return filteredActivities.reduce(
      (total, activity) => {
        // Support both old seatsLeft and new participantSeatsLeft/volunteerSeatsLeft
        const seats = activity.participantSeatsLeft ?? activity.volunteerSeatsLeft ?? activity.seatsLeft ?? 0
        return total + Math.max(seats, 0)
      },
      0
    )
  }, [filteredActivities])

  const lowCapacityCount = useMemo(() => {
    return filteredActivities.filter(
      (activity) => {
        const seats = activity.participantSeatsLeft ?? activity.volunteerSeatsLeft ?? activity.seatsLeft ?? 0
        return seats > 0 && seats <= 2
      }
    ).length
  }, [filteredActivities])

  const uniqueDays = useMemo(() => {
    return new Set(filteredActivities.map((activity) => activity.date)).size
  }, [filteredActivities])

  const nextActivity = useMemo(() => {
    const sorted = [...filteredActivities].sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.startTime || '00:00'}`)
      const dateB = new Date(`${b.date}T${b.startTime || '00:00'}`)
      return dateA.getTime() - dateB.getTime()
    })
    return sorted[0]
  }, [filteredActivities])

  const matchRate =
    publicActivities.length > 0
      ? Math.round((filteredActivities.length / publicActivities.length) * 100)
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

  // For list view
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

  const formatTime = (time?: string) => {
    const safe = time || '00:00'
    const [hours, minutes] = safe.split(':')
    const hour = parseInt(hours, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const statusLabel = isLoading ? 'Loading...' : `${filteredActivities.length} sessions matched`

  if (isLoading) {
    return (
      <div className="container-wide">
        <div className="status loading">
          <span className="spinner" aria-hidden="true" />
          Loading activities...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container-wide">
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
    <div className="container-wide">
      <section className="hero section-tight reveal">
        <div>
          <span className="badge">Calendar view</span>
          <h1>Unified activity schedule</h1>
          <p>
            Filter by program, role, or type to see the sessions that matter
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
                ? `${nextActivity.title} at ${formatTime(nextActivity.startTime)}`
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
                {(['Calendar', 'List'] as const).map((mode) => (
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
            <span className="filter-label">Type</span>
            {typeOptions.map((option) => (
              <button
                key={option}
                type="button"
                className={`chip ${typeFilter === option ? 'active' : ''}`}
                onClick={() => setTypeFilter(option)}
              >
                {option}
              </button>
            ))}
          </div>
          <div className="filters">
            <span className="filter-label">Accessibility</span>
            <button
              type="button"
              className={`chip ${accessibilityFilter ? 'active' : ''}`}
              onClick={() => setAccessibilityFilter(!accessibilityFilter)}
            >
               Wheelchair accessible
            </button>
            <button
              type="button"
              className={`chip ${freeOnlyFilter ? 'active' : ''}`}
              onClick={() => setFreeOnlyFilter(!freeOnlyFilter)}
            >
              Free activities only
            </button>
          </div>
        </div>

        {viewMode === 'Calendar' ? (
          <CalendarGrid 
            activities={publicActivities}
            filteredActivities={filteredActivities}
          />
        ) : filteredActivities.length === 0 ? (
          <div className="empty-state">
            <strong>No activities match those filters</strong>
            <span>Try switching date range, program, role, or type.</span>
            {filtersActive && (
              <button className="button" type="button" onClick={resetFilters}>
                Reset filters
              </button>
            )}
          </div>
        ) : (
          <div className="calendar-list-view">
            {groupedByDate.map(([date, items]) => (
              <div key={date} className="day-panel">
                <div className="day-title">
                  {formatDay(date)}
                  <span className="day-count">{items.length} sessions</span>
                </div>
                <div className="day-cards">
                  {items.map((activity) => (
                    <ActivityCard key={activity.id} activity={activity} />
                  ))}
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
