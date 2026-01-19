'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import type { Activity } from '../data/sampleData'

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

type ApiResponse<T> = {
  data?: T
  error?: string
  message?: string
}

type VolunteerProfile = {
  name: string
  email: string
  cadence: 'All cadences' | 'Ad hoc' | 'Weekly' | 'Twice weekly' | 'Three or more'
  program: string
  morning: boolean
  afternoon: boolean
}

type SignupState = {
  status: 'idle' | 'submitting' | 'success' | 'error'
  message: string | null
  activityId: string | null
}

type Commitment = {
  activityId: string
  title: string
  date: string
  time: string
  location: string
}

const cadenceOptions: VolunteerProfile['cadence'][] = [
  'All cadences',
  'Ad hoc',
  'Weekly',
  'Twice weekly',
  'Three or more',
]

const isValidEmail = (value: string) => /^[^@]+@[^@]+\.[^@]+$/.test(value)

const formatShortDate = (isoDate: string) => {
  const date = new Date(`${isoDate}T00:00:00`)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

const parseHour = (time: string) => {
  const safe = time || '00:00'
  const [hours, minutes] = safe.split(':')
  const hour = Number(hours)
  return Number.isNaN(hour) ? null : hour
}

const sortByDateTime = (a: Activity, b: Activity) => {
  const dateA = new Date(`${a.date}T${a.time || '00:00'}`)
  const dateB = new Date(`${b.date}T${b.time || '00:00'}`)
  return dateA.getTime() - dateB.getTime()
}

export default function VolunteerPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<VolunteerProfile>({
    name: '',
    email: '',
    cadence: 'All cadences',
    program: 'All programs',
    morning: true,
    afternoon: true,
  })
  const [preferencesSaved, setPreferencesSaved] = useState(false)
  const [preferencesMessage, setPreferencesMessage] = useState<string | null>(
    null
  )
  const [signupState, setSignupState] = useState<SignupState>({
    status: 'idle',
    message: null,
    activityId: null,
  })
  const [commitments, setCommitments] = useState<Commitment[]>([])

  useEffect(() => {
    let isMounted = true

    const loadActivities = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(
          `${apiBase}/api/activities?role=Volunteers`
        )
        const body = (await response.json().catch(() => null)) as
          | ApiResponse<Activity[]>
          | null

        if (!response.ok) {
          throw new Error(body?.error || 'Unable to load volunteer sessions.')
        }

        if (isMounted) {
          setActivities(body?.data ?? [])
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load volunteer sessions.'
          )
          setActivities([])
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadActivities()

    return () => {
      isMounted = false
    }
  }, [])

  const programOptions = useMemo(() => {
    const options = new Set<string>()
    options.add('All programs')
    for (const activity of activities) {
      options.add(activity.program)
    }
    return Array.from(options)
  }, [activities])

  const cadencePreference =
    profile.cadence === 'All cadences' ? null : profile.cadence

  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      if (activity.role !== 'Volunteers') {
        return false
      }
      if (profile.program !== 'All programs' && activity.program !== profile.program) {
        return false
      }
      if (cadencePreference && activity.cadence !== cadencePreference) {
        return false
      }
      if (!profile.morning && !profile.afternoon) {
        return true
      }
      const hour = parseHour(activity.time)
      if (hour === null) {
        return true
      }
      const isMorning = hour < 12
      const isAfternoon = hour >= 12
      return (profile.morning && isMorning) || (profile.afternoon && isAfternoon)
    })
  }, [activities, cadencePreference, profile.program, profile.morning, profile.afternoon])

  const profileReady =
    profile.name.trim().length > 0 && isValidEmail(profile.email)

  const matchCount = filteredActivities.length
  const openSlots = filteredActivities.reduce(
    (total, activity) => total + Math.max(activity.seatsLeft, 0),
    0
  )
  const lowCapacityCount = filteredActivities.filter(
    (activity) => activity.seatsLeft > 0 && activity.seatsLeft <= 2
  ).length

  const sortedFilteredActivities = useMemo(() => {
    return [...filteredActivities].sort(sortByDateTime)
  }, [filteredActivities])

  const nextShift = sortedFilteredActivities[0]

  const uniqueDays = new Set(filteredActivities.map((activity) => activity.date))
    .size

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

  const scheduleBuckets = useMemo(() => {
    const groups = new Map<string, Activity[]>()
    for (const activity of sortedFilteredActivities) {
      const group = groups.get(activity.date)
      if (group) {
        group.push(activity)
      } else {
        groups.set(activity.date, [activity])
      }
    }
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [sortedFilteredActivities])

  const scheduleDays = scheduleBuckets.slice(0, 4)

  const updateProfile = <Key extends keyof VolunteerProfile>(
    key: Key,
    value: VolunteerProfile[Key]
  ) => {
    setProfile((prev) => ({ ...prev, [key]: value }))
    setPreferencesSaved(false)
    setPreferencesMessage(null)
  }

  const handlePreferencesSave = () => {
    setPreferencesSaved(true)
    setPreferencesMessage('Preferences saved for this session.')
  }

  const handleSignup = async (activity: Activity) => {
    if (!profileReady || signupState.status === 'submitting') {
      return
    }
    if (activity.seatsLeft <= 0) {
      setSignupState({
        status: 'error',
        message: 'This session is already full.',
        activityId: activity.id,
      })
      return
    }

    setSignupState({
      status: 'submitting',
      message: null,
      activityId: activity.id,
    })

    try {
      const response = await fetch(`${apiBase}/api/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityId: activity.id,
          name: profile.name.trim(),
          email: profile.email.trim(),
          role: 'Volunteer',
          membership:
            profile.cadence === 'All cadences' ? activity.cadence : profile.cadence,
          accessibility: false,
          caregiverPayment: false,
          notes: '',
        }),
      })
      const body = (await response.json().catch(() => null)) as
        | ApiResponse<{ id: string }>
        | null

      if (!response.ok) {
        throw new Error(body?.error || 'Unable to reserve the shift.')
      }

      setActivities((prev) =>
        prev.map((item) =>
          item.id === activity.id
            ? { ...item, seatsLeft: Math.max(item.seatsLeft - 1, 0) }
            : item
        )
      )
      setCommitments((prev) => {
        if (prev.some((commitment) => commitment.activityId === activity.id)) {
          return prev
        }
        const next = [
          ...prev,
          {
            activityId: activity.id,
            title: activity.title,
            date: activity.date,
            time: activity.time,
            location: activity.location,
          },
        ]
        return next.sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.time || '00:00'}`)
          const dateB = new Date(`${b.date}T${b.time || '00:00'}`)
          return dateA.getTime() - dateB.getTime()
        })
      })

      setSignupState({
        status: 'success',
        message: `Shift reserved for ${activity.title}.`,
        activityId: activity.id,
      })
    } catch (err) {
      setSignupState({
        status: 'error',
        message:
          err instanceof Error ? err.message : 'Unable to reserve the shift.',
        activityId: activity.id,
      })
    }
  }

  const checkedSteps = {
    profile: profileReady,
    preferences: preferencesSaved,
    firstShift: commitments.length > 0,
  }

  return (
    <div className="container">
      <section className="hero section-tight reveal">
        <div>
          <span className="badge">Volunteer view</span>
          <h1>Discover opportunities that fit your week</h1>
          <p>
            Set your availability once, then choose sessions from a shared
            calendar that already accounts for capacity and support needs.
          </p>
        </div>
        <div className="hero-card">
          <h3>Volunteer readiness</h3>
          <p>Track matches, open slots, and your confirmed shifts.</p>
          <div className="stat-row">
            <div className="stat-pill">
              <span className="stat-pill-value">{matchCount}</span>
              <span className="stat-pill-label">Matches this week</span>
            </div>
            <div className="stat-pill">
              <span className="stat-pill-value">{openSlots}</span>
              <span className="stat-pill-label">Open slots</span>
            </div>
            <div className="stat-pill">
              <span className="stat-pill-value">{commitments.length}</span>
              <span className="stat-pill-label">Shifts claimed</span>
            </div>
            <div className="stat-pill">
              <span className="stat-pill-value">{lowCapacityCount}</span>
              <span className="stat-pill-label">Low capacity</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section reveal delay-1">
        <div className="section-heading">
          <span className="section-eyebrow">Insights</span>
          <h2 className="section-title">Volunteer scheduling signals</h2>
          <p className="section-subtitle">
            Track upcoming shifts, match quality, and program coverage before you
            commit.
          </p>
        </div>
        <div className="insight-grid">
          <div className="insight-card">
            <span className="insight-title">Next shift</span>
            <span className="insight-value">
              {nextShift ? formatShortDate(nextShift.date) : 'No sessions'}
            </span>
            <span className="insight-meta">
              {nextShift
                ? `${nextShift.title} at ${nextShift.time}`
                : 'Check back for new opportunities.'}
            </span>
          </div>
          <div className="insight-card">
            <span className="insight-title">Open slots</span>
            <span className="insight-value">{openSlots}</span>
            <span className="insight-meta">
              {lowCapacityCount} sessions at low capacity.
            </span>
          </div>
          <div className="insight-card">
            <span className="insight-title">Preference match</span>
            <span className="insight-value">{matchRate}%</span>
            <span className="insight-meta">
              {cadencePreference
                ? `Cadence: ${cadencePreference}`
                : 'All cadences shown.'}
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
            <span className="insight-meta">{uniqueDays} days with openings.</span>
          </div>
        </div>
      </section>

      <section className="section reveal delay-1">
        <div className="section-heading">
          <span className="section-eyebrow">Suggested sessions</span>
          <h2 className="section-title">Priority matches for you</h2>
          <p className="section-subtitle">
            These opportunities align with your availability and program
            preferences.
          </p>
        </div>

        {error && (
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
        )}

        {!profileReady && (
          <div className="status warning">
            Add your name and email to claim a volunteer shift.
          </div>
        )}

        {signupState.status === 'success' && signupState.message && (
          <div className="status success">{signupState.message}</div>
        )}
        {signupState.status === 'error' && signupState.message && (
          <div className="status error">{signupState.message}</div>
        )}

        {isLoading ? (
          <div className="status loading">
            <span className="spinner" aria-hidden="true" />
            Loading volunteer opportunities...
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="empty-state">
            <strong>No volunteer sessions match those preferences</strong>
            <span>Try adjusting your program or time-of-day filters.</span>
          </div>
        ) : (
          <div className="match-grid">
            {filteredActivities.map((activity) => {
              const isFull = activity.seatsLeft <= 0
              const isLow = activity.seatsLeft > 0 && activity.seatsLeft <= 2
              const availabilityLabel = isFull
                ? 'Full'
                : `${activity.seatsLeft} of ${activity.capacity} slots open`
              const isSubmitting =
                signupState.status === 'submitting' &&
                signupState.activityId === activity.id
              const matchesProgram =
                profile.program === 'All programs' || activity.program === profile.program
              const matchesCadence =
                !cadencePreference || activity.cadence === cadencePreference
              const hour = parseHour(activity.time)
              const isMorningSlot = hour !== null && hour < 12
              const isAfternoonSlot = hour !== null && hour >= 12

              return (
                <article key={activity.id} className="match-card">
                  <div className="match-header">
                    <span className="activity-time">{activity.time}</span>
                    <span className="role-pill" data-variant="Volunteers">
                      Volunteer
                    </span>
                  </div>
                  <h3>{activity.title}</h3>
                  <p className="match-meta">
                    {formatShortDate(activity.date)} - {activity.location}
                  </p>
                  <div className="match-reasons">
                    <span className="match-reason">{activity.program}</span>
                    <span className="match-reason">{activity.cadence}</span>
                    {profile.program !== 'All programs' && matchesProgram && (
                      <span className="match-reason">Program match</span>
                    )}
                    {cadencePreference && matchesCadence && (
                      <span className="match-reason">Cadence match</span>
                    )}
                    {hour !== null && (
                      <span className="match-reason">
                        {isMorningSlot ? 'Morning' : 'Afternoon'} slot
                      </span>
                    )}
                    {isLow && (
                      <span className="alert-pill" data-variant="low">
                        Low seats
                      </span>
                    )}
                    {isFull && (
                      <span className="alert-pill" data-variant="full">
                        Full
                      </span>
                    )}
                  </div>
                  <div className="activity-tags">
                    <span className="activity-tag" data-variant={activity.program}>
                      {activity.program}
                    </span>
                    <span className="activity-tag" data-variant={activity.cadence}>
                      {activity.cadence}
                    </span>
                  </div>
                  <div className="activity-footer">
                    <span className="activity-availability">
                      {availabilityLabel}
                    </span>
                    <button
                      className="button"
                      type="button"
                      onClick={() => handleSignup(activity)}
                      disabled={!profileReady || isFull || isSubmitting}
                    >
                      {isFull
                        ? 'Session full'
                        : isSubmitting
                          ? 'Submitting...'
                          : 'Claim shift'}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="section reveal delay-2" id="volunteer-schedule">
        <div className="section-heading">
          <span className="section-eyebrow">Schedule planner</span>
          <h2 className="section-title">Build your volunteer week</h2>
          <p className="section-subtitle">
            Review openings by day and claim shifts that fit your availability.
          </p>
        </div>

        {scheduleDays.length === 0 ? (
          <div className="empty-state">
            <strong>No schedule view yet</strong>
            <span>Adjust your preferences to see day-by-day openings.</span>
          </div>
        ) : (
          <div className="schedule-grid">
            {scheduleDays.map(([date, items]) => (
              <div key={date} className="schedule-day">
                <div className="schedule-day-header">
                  <span className="schedule-day-title">{formatShortDate(date)}</span>
                  <span className="schedule-day-meta">
                    {items.length} sessions
                  </span>
                </div>
                <div className="schedule-slots">
                  {items.map((activity) => {
                    const isFull = activity.seatsLeft <= 0
                    const isCommitted = commitments.some(
                      (commitment) => commitment.activityId === activity.id
                    )
                    const isSubmitting =
                      signupState.status === 'submitting' &&
                      signupState.activityId === activity.id

                    return (
                      <div key={activity.id} className="schedule-slot">
                        <div>
                          <span className="schedule-time">{activity.time}</span>
                          <h4 className="schedule-title">{activity.title}</h4>
                          <span className="schedule-meta">
                            {activity.location}
                          </span>
                        </div>
                        <div className="schedule-actions">
                          <span className="schedule-availability">
                            {activity.seatsLeft} slots
                          </span>
                          <button
                            className="button ghost"
                            type="button"
                            onClick={() => handleSignup(activity)}
                            disabled={
                              !profileReady ||
                              isFull ||
                              isCommitted ||
                              isSubmitting
                            }
                          >
                            {isCommitted
                              ? 'Claimed'
                              : isFull
                                ? 'Full'
                                : isSubmitting
                                  ? 'Submitting...'
                                  : 'Claim'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="detail-grid reveal delay-2">
        <div className="detail-card">
          <h2>Availability preferences</h2>
          <p className="detail-subtitle">
            Share when you can help and what types of sessions you enjoy.
          </p>
          <div className="form">
            <label className="form-field">
              <span className="form-label">Full name</span>
              <input
                className="input"
                type="text"
                value={profile.name}
                onChange={(event) => updateProfile('name', event.target.value)}
                placeholder="Volunteer name"
              />
            </label>
            <label className="form-field">
              <span className="form-label">Email</span>
              <input
                className="input"
                type="email"
                value={profile.email}
                onChange={(event) => updateProfile('email', event.target.value)}
                placeholder="name@email.com"
              />
            </label>
            <label className="form-field">
              <span className="form-label">Preferred cadence</span>
              <select
                className="input"
                value={profile.cadence}
                onChange={(event) =>
                  updateProfile(
                    'cadence',
                    event.target.value as VolunteerProfile['cadence']
                  )
                }
              >
                {cadenceOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
            <div className="form-row">
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={profile.morning}
                  onChange={(event) =>
                    updateProfile('morning', event.target.checked)
                  }
                />
                <span>Morning sessions</span>
              </label>
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={profile.afternoon}
                  onChange={(event) =>
                    updateProfile('afternoon', event.target.checked)
                  }
                />
                <span>Afternoon sessions</span>
              </label>
            </div>
            <label className="form-field">
              <span className="form-label">Preferred program</span>
              <select
                className="input"
                value={profile.program}
                onChange={(event) => updateProfile('program', event.target.value)}
              >
                {programOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
            <button
              className="button primary"
              type="button"
              onClick={handlePreferencesSave}
            >
              Save preferences
            </button>
            {preferencesMessage && (
              <div className="status success">{preferencesMessage}</div>
            )}
          </div>
        </div>

        <div className="detail-card">
          <h2>Onboarding checklist</h2>
          <p className="detail-subtitle">
            Complete these steps to start confirming sessions.
          </p>
          <div className="checklist">
            <label className="checkbox-field">
              <input type="checkbox" checked={checkedSteps.profile} readOnly />
              <span>Volunteer profile completed</span>
            </label>
            <label className="checkbox-field">
              <input type="checkbox" checked={checkedSteps.preferences} readOnly />
              <span>Availability saved</span>
            </label>
            <label className="checkbox-field">
              <input type="checkbox" checked={checkedSteps.firstShift} readOnly />
              <span>First shift claimed</span>
            </label>
          </div>
        </div>

        <div className="detail-card">
          <h2>Volunteer guidance</h2>
          <p className="detail-subtitle">
            Keep your schedule predictable and communicate early.
          </p>
          <ul className="detail-list">
            <li>Claim shifts at least 48 hours in advance when possible.</li>
            <li>Check for low-capacity alerts before confirming.</li>
            <li>Share changes with staff if availability shifts.</li>
          </ul>
          <div className="status warning">
            Save preferences to refresh the recommended schedule.
          </div>
        </div>

        <div className="detail-card">
          <h2>Your upcoming shifts</h2>
          <p className="detail-subtitle">
            Shifts you have claimed during this session.
          </p>
          {commitments.length === 0 ? (
            <div className="empty-state">
              <strong>No shifts claimed yet</strong>
              <span>Select a session above to add it to your schedule.</span>
              <button
                className="button"
                type="button"
                onClick={() => {
                  const anchor = document.getElementById('volunteer-schedule')
                  if (anchor) {
                    anchor.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                }}
              >
                View schedule planner
              </button>
            </div>
          ) : (
            <div className="admin-list">
              {commitments.map((commitment) => (
                <div key={commitment.activityId} className="admin-item">
                  <div>
                    <h3>{commitment.title}</h3>
                    <p className="admin-meta">
                      {formatShortDate(commitment.date)} at {commitment.time} -{' '}
                      {commitment.location}
                    </p>
                  </div>
                  <div className="admin-actions">
                    <Link
                      className="button"
                      href={`/activity/${commitment.activityId}`}
                    >
                      View details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="callout reveal delay-2">
        <h2>Ready to lock in your next shift?</h2>
        <p>
          Explore the full calendar to find every volunteer opportunity in one
          place.
        </p>
        <div className="callout-actions">
          <Link className="button primary" href="/calendar">
            Browse full calendar
          </Link>
          <Link className="button ghost" href="/admin">
            Connect with staff
          </Link>
        </div>
      </section>
    </div>
  )
}
