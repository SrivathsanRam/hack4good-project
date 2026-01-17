<<<<<<< HEAD
'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import type { Activity } from '../data/sampleData'

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'

type ApiResponse<T> = {
  data?: T
  error?: string
  message?: string
}

type VolunteerProfile = {
  name: string
  email: string
  cadence: 'Ad hoc' | 'Weekly' | 'Twice weekly' | 'Three or more'
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
=======
﻿'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

type Activity = {
  id: string
>>>>>>> def313e1a92930bec4bfed74d499b6e46189777b
  title: string
  date: string
  time: string
  location: string
<<<<<<< HEAD
}

const cadenceOptions: VolunteerProfile['cadence'][] = [
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
  const hour = Number(time.split(':')[0])
  return Number.isNaN(hour) ? null : hour
}

export default function VolunteerPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<VolunteerProfile>({
    name: '',
    email: '',
    cadence: 'Ad hoc',
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
          `${API_BASE_URL}/api/activities?role=Volunteers`
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

  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      if (activity.role !== 'Volunteers') {
        return false
      }
      if (profile.program !== 'All programs' && activity.program !== profile.program) {
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
  }, [activities, profile.program, profile.morning, profile.afternoon])

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
      const response = await fetch(`${API_BASE_URL}/api/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityId: activity.id,
          name: profile.name.trim(),
          email: profile.email.trim(),
          role: 'Volunteer',
          membership: profile.cadence,
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
=======
  program: string
  role: 'Participants' | 'Volunteers'
  capacity: number
  seatsLeft: number
  cadence: string
  description: string
}

export default function VolunteerPage() {
  const [volunteerActivities, setVolunteerActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchVolunteerActivities = async () => {
      try {
        const response = await fetch(`${apiBase}/api/activities?role=Volunteers`)
        if (response.ok) {
          const result = await response.json()
          setVolunteerActivities(result.data || [])
        }
      } catch (err) {
        console.error('Failed to fetch volunteer activities:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchVolunteerActivities()
  }, [])

  const formatDate = (isoDate: string) => {
    const date = new Date(`${isoDate}T00:00:00`)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
>>>>>>> def313e1a92930bec4bfed74d499b6e46189777b
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
<<<<<<< HEAD
              <span className="stat-pill-value">{matchCount}</span>
              <span className="stat-pill-label">Matches this week</span>
=======
              <span className="stat-pill-value">{volunteerActivities.length}</span>
              <span className="stat-pill-label">Opportunities</span>
>>>>>>> def313e1a92930bec4bfed74d499b6e46189777b
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
          <span className="section-eyebrow">Suggested sessions</span>
          <h2 className="section-title">Priority matches for you</h2>
          <p className="section-subtitle">
            These opportunities align with your availability and program
            preferences.
          </p>
        </div>
<<<<<<< HEAD

        {error && (
          <div className="status error">
            {error} Ensure the backend is running at {API_BASE_URL}.
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

=======
>>>>>>> def313e1a92930bec4bfed74d499b6e46189777b
        {isLoading ? (
          <div className="status loading">
            <span className="spinner" aria-hidden="true" />
            Loading volunteer opportunities...
          </div>
<<<<<<< HEAD
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
=======
        ) : volunteerActivities.length === 0 ? (
          <div className="empty-state">
            <strong>No volunteer opportunities</strong>
            <span>Check back later for new opportunities.</span>
          </div>
        ) : (
          <div className="match-grid">
            {volunteerActivities.map((activity) => (
              <article key={activity.id} className="match-card">
                <div className="match-header">
                  <span className="activity-time">{activity.time}</span>
                  <span className="role-pill" data-variant="Volunteers">
                    Volunteer
                  </span>
                </div>
                <h3>{activity.title}</h3>
                <p className="match-meta">{formatDate(activity.date)} - {activity.location}</p>
                <div className="match-reasons">
                  <span className="match-reason">{activity.cadence}</span>
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
                    {activity.seatsLeft} of {activity.capacity} slots open
                  </span>
                  <Link className="button" href={`/activity/${activity.id}`}>
                    View details
                  </Link>
                </div>
              </article>
            ))}
>>>>>>> def313e1a92930bec4bfed74d499b6e46189777b
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
          <h2>Your upcoming shifts</h2>
          <p className="detail-subtitle">
            Shifts you have claimed during this session.
          </p>
          {commitments.length === 0 ? (
            <div className="empty-state">
              <strong>No shifts claimed yet</strong>
              <span>Select a session above to add it to your schedule.</span>
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
