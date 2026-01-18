'use client'

import Link from 'next/link'
import { type FormEvent, useEffect, useMemo, useState } from 'react'
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

type MembershipOption = 'Ad hoc' | 'Weekly' | 'Twice weekly' | 'Three or more'

type ProgramOption =
  | 'All programs'
  | 'Movement'
  | 'Creative'
  | 'Caregiver sessions'

type ParticipantProfile = {
  name: string
  email: string
  membership: '' | MembershipOption
  program: ProgramOption
  morning: boolean
  afternoon: boolean
}

type RegistrationDetails = {
  accessibility: boolean
  caregiverPayment: boolean
  notes: string
}

const membershipOptions: MembershipOption[] = [
  'Ad hoc',
  'Weekly',
  'Twice weekly',
  'Three or more',
]

const programOptions: ProgramOption[] = [
  'All programs',
  'Movement',
  'Creative',
  'Caregiver sessions',
]

const isValidEmail = (value: string) => /^[^@]+@[^@]+\.[^@]+$/.test(value)

const formatDate = (isoDate: string) => {
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

const sortByDateTime = (a: Activity, b: Activity) => {
  const dateA = new Date(`${a.date}T${a.time || '00:00'}`)
  const dateB = new Date(`${b.date}T${b.time || '00:00'}`)
  return dateA.getTime() - dateB.getTime()
}

export default function ParticipantPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [registeredActivities, setRegisteredActivities] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<
    'upcoming' | 'registered' | 'history'
  >('upcoming')
  const [selectedActivityId, setSelectedActivityId] = useState('')
  const [profile, setProfile] = useState<ParticipantProfile>({
    name: '',
    email: '',
    membership: '',
    program: 'All programs',
    morning: true,
    afternoon: true,
  })
  const [registrationDetails, setRegistrationDetails] =
    useState<RegistrationDetails>({
      accessibility: false,
      caregiverPayment: false,
      notes: '',
    })
  const [registrationErrors, setRegistrationErrors] = useState<
    Record<string, string>
  >({})
  const [registrationStatus, setRegistrationStatus] = useState<
    'idle' | 'submitting' | 'success' | 'error'
  >('idle')
  const [registrationMessage, setRegistrationMessage] = useState<string | null>(
    null
  )
  const [preferencesMessage, setPreferencesMessage] = useState<string | null>(
    null
  )

  useEffect(() => {
    const fetchParticipantActivities = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(
          `${apiBase}/api/activities?role=Participants`
        )
        if (response.ok) {
          const result = await response.json()
          const data = result.data || []
          setActivities(data)
          if (data.length > 0) {
            setSelectedActivityId((prev) => prev || data[0].id)
          }
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

  const participantActivities = useMemo(() => {
    return activities.filter((activity) => activity.role === 'Participants')
  }, [activities])

  const sortedActivities = useMemo(() => {
    return [...participantActivities].sort(sortByDateTime)
  }, [participantActivities])

  const nextActivity = sortedActivities[0]

  const openSeats = participantActivities.reduce(
    (total, activity) => total + Math.max(activity.seatsLeft, 0),
    0
  )

  const lowCapacityCount = participantActivities.filter(
    (activity) => activity.seatsLeft > 0 && activity.seatsLeft <= 2
  ).length

  const uniqueDays = new Set(participantActivities.map((activity) => activity.date))
    .size

  const daySummary = useMemo(() => {
    const counts = new Map<string, number>()
    for (const activity of participantActivities) {
      const date = new Date(`${activity.date}T00:00:00`)
      const label = date.toLocaleDateString('en-US', { weekday: 'short' })
      counts.set(label, (counts.get(label) ?? 0) + 1)
    }
    const entries = Array.from(counts.entries())
    if (entries.length === 0) {
      return { label: 'N/A', count: 0 }
    }
    const top = entries.reduce((best, current) =>
      current[1] > best[1] ? current : best
    )
    return { label: top[0], count: top[1] }
  }, [participantActivities])

  const programSummary = useMemo(() => {
    const programLabels = programOptions.slice(1)
    const counts = programLabels.map((program) => ({
      label: program,
      count: participantActivities.filter(
        (activity) => activity.program === program
      ).length,
    }))
    const total = counts.reduce((sum, item) => sum + item.count, 0)
    return counts.map((item) => ({
      ...item,
      percent: total > 0 ? Math.round((item.count / total) * 100) : 0,
    }))
  }, [participantActivities])

  const topProgram = programSummary.reduce(
    (best, current) => (current.count > best.count ? current : best),
    programSummary[0] || { label: 'N/A', count: 0, percent: 0 }
  )

  const recommendedActivities = useMemo(() => {
    return sortedActivities
      .filter((activity) => {
        if (
          profile.program !== 'All programs' &&
          activity.program !== profile.program
        ) {
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
      .slice(0, 3)
  }, [profile.afternoon, profile.morning, profile.program, sortedActivities])

  const selectedActivity = useMemo(() => {
    return (
      participantActivities.find(
        (activity) => activity.id === selectedActivityId
      ) || null
    )
  }, [participantActivities, selectedActivityId])

  const filteredActivities = useMemo(() => {
    if (activeTab === 'registered') {
      return participantActivities.filter((activity) =>
        registeredActivities.includes(activity.id)
      )
    }
    if (activeTab === 'history') {
      return []
    }
    return participantActivities
  }, [activeTab, participantActivities, registeredActivities])

  const updateProfile = <Key extends keyof ParticipantProfile>(
    key: Key,
    value: ParticipantProfile[Key]
  ) => {
    setProfile((prev) => ({ ...prev, [key]: value }))
    setPreferencesMessage(null)
    setRegistrationMessage(null)
  }

  const updateRegistrationDetails = <Key extends keyof RegistrationDetails>(
    key: Key,
    value: RegistrationDetails[Key]
  ) => {
    setRegistrationDetails((prev) => ({ ...prev, [key]: value }))
    setRegistrationMessage(null)
  }

  const handleSelectActivity = (activityId: string) => {
    if (!activityId) {
      return
    }
    setSelectedActivityId(activityId)
    setRegistrationStatus('idle')
    setRegistrationMessage(null)
    setRegistrationErrors({})
    const anchor = document.getElementById('participant-registration')
    if (anchor) {
      anchor.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const validateRegistration = () => {
    const nextErrors: Record<string, string> = {}
    if (!profile.name.trim()) {
      nextErrors.name = 'Name is required.'
    }
    if (!profile.email.trim()) {
      nextErrors.email = 'Email is required.'
    } else if (!isValidEmail(profile.email)) {
      nextErrors.email = 'Enter a valid email.'
    }
    if (!profile.membership) {
      nextErrors.membership = 'Select a membership cadence.'
    }
    setRegistrationErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedActivity || registrationStatus === 'submitting') {
      setRegistrationStatus('error')
      setRegistrationMessage('Select a session to register.')
      return
    }

    if (registeredActivities.includes(selectedActivity.id)) {
      setRegistrationStatus('error')
      setRegistrationMessage('You are already registered for this session.')
      return
    }

    if (selectedActivity.seatsLeft <= 0) {
      setRegistrationStatus('error')
      setRegistrationMessage('This session is full. Choose another activity.')
      return
    }

    setRegistrationMessage(null)

    if (!validateRegistration()) {
      setRegistrationStatus('error')
      setRegistrationMessage('Complete the required fields to continue.')
      return
    }

    setRegistrationStatus('submitting')

    try {
      const response = await fetch(`${apiBase}/api/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityId: selectedActivity.id,
          name: profile.name.trim(),
          email: profile.email.trim(),
          role: 'Participant',
          membership: profile.membership,
          accessibility: registrationDetails.accessibility,
          caregiverPayment: registrationDetails.caregiverPayment,
          notes: registrationDetails.notes,
        }),
      })

      const result = (await response.json().catch(() => null)) as
        | { data?: { id: string }; error?: string }
        | null

      if (!response.ok) {
        throw new Error(result?.error || 'Failed to register')
      }

      setActivities((prev) =>
        prev.map((activity) =>
          activity.id === selectedActivity.id
            ? { ...activity, seatsLeft: Math.max(activity.seatsLeft - 1, 0) }
            : activity
        )
      )
      setRegisteredActivities((prev) =>
        prev.includes(selectedActivity.id)
          ? prev
          : [...prev, selectedActivity.id]
      )
      setRegistrationStatus('success')
      setRegistrationMessage(`Registration saved for ${selectedActivity.title}.`)
      setRegistrationDetails({
        accessibility: false,
        caregiverPayment: false,
        notes: '',
      })
      setActiveTab('registered')
    } catch (err) {
      setRegistrationStatus('error')
      setRegistrationMessage(
        err instanceof Error ? err.message : 'Failed to register'
      )
    }
  }

  const handlePreferencesSave = () => {
    setPreferencesMessage('Preferences saved for this session.')
  }

  const getPercentFull = (activity: Activity) => {
    return Math.round(
      ((activity.capacity - activity.seatsLeft) / activity.capacity) * 100
    )
  }

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

  const isFull = selectedActivity ? selectedActivity.seatsLeft <= 0 : false
  const isSubmitting = registrationStatus === 'submitting'
  const registrationReady =
    profile.name.trim().length > 0 &&
    isValidEmail(profile.email) &&
    profile.membership

  return (
    <div className="container">
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
            <button
              className="button"
              type="button"
              onClick={() => handleSelectActivity(selectedActivityId)}
            >
              Jump to registration
            </button>
          </div>
        </div>
        <div className="hero-card">
          <h3>Your activity summary</h3>
          <p>
            Track your engagement and find new programs tailored to your
            preferences.
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
                <span className="stat-pill-value">{participantActivities.length}</span>
                <span className="stat-pill-label">Available now</span>
              </div>
              <div className="stat-pill">
                <span className="stat-pill-value">{openSeats}</span>
                <span className="stat-pill-label">Open seats</span>
              </div>
              <div className="stat-pill">
                <span className="stat-pill-value">{uniqueDays}</span>
                <span className="stat-pill-label">Days covered</span>
              </div>
            </div>
          )}
          <p className="hero-note">
            {nextActivity
              ? `Next session: ${nextActivity.title} on ${formatDate(
                  nextActivity.date
                )}`
              : 'No upcoming sessions yet.'}
          </p>
        </div>
      </section>

      <section className="section reveal delay-1">
        <div className="section-heading">
          <span className="section-eyebrow">Insights</span>
          <h2 className="section-title">Participation highlights</h2>
          <p className="section-subtitle">
            A quick snapshot of what is available and how it aligns with your
            preferences.
          </p>
        </div>
        <div className="insight-grid">
          <div className="insight-card">
            <span className="insight-title">Next up</span>
            <span className="insight-value">
              {nextActivity ? formatDate(nextActivity.date) : 'No sessions'}
            </span>
            <span className="insight-meta">
              {nextActivity
                ? `${nextActivity.title} at ${nextActivity.time}`
                : 'Check back for new activities.'}
            </span>
          </div>
          <div className="insight-card">
            <span className="insight-title">Open seats</span>
            <span className="insight-value">{openSeats}</span>
            <span className="insight-meta">
              Across {participantActivities.length} upcoming sessions.
            </span>
          </div>
          <div className="insight-card">
            <span className="insight-title">Preference matches</span>
            <span className="insight-value">{recommendedActivities.length}</span>
            <span className="insight-meta">
              Sessions matching your time and program preferences.
            </span>
          </div>
          <div className="insight-card">
            <span className="insight-title">Program mix</span>
            {participantActivities.length === 0 ? (
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
            <span className="insight-meta">
              Focus area: {topProgram.label} ({topProgram.count})
            </span>
          </div>
        </div>
      </section>

      <section className="section reveal delay-1">
        <div className="stat-grid participant-stats">
          <div className="stat-card">
            <span className="stat-value">{participantActivities.length}</span>
            <span className="stat-label">Sessions available this month</span>
            <span className="stat-foot">Across all programs</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{openSeats}</span>
            <span className="stat-label">Seats open right now</span>
            <span className="stat-foot">Keep an eye on low capacity sessions.</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{lowCapacityCount}</span>
            <span className="stat-label">Low capacity alerts</span>
            <span className="stat-foot">Book soon to secure a spot.</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{daySummary.label}</span>
            <span className="stat-label">Most active day</span>
            <span className="stat-foot">{daySummary.count} sessions scheduled.</span>
          </div>
        </div>
      </section>

      <section className="section reveal delay-2">
        <div className="section-heading">
          <span className="section-eyebrow">Your sessions</span>
          <h2 className="section-title">Register and manage activity plans</h2>
          <p className="section-subtitle">
            Choose a session on the left, then complete the registration panel
            to confirm your spot.
          </p>
        </div>

        <div className="workspace-grid">
          <div>
            <div className="toggle-group" style={{ marginBottom: '24px' }}>
              <button
                className={`toggle-button ${
                  activeTab === 'upcoming' ? 'active' : ''
                }`}
                onClick={() => setActiveTab('upcoming')}
              >
                Available
              </button>
              <button
                className={`toggle-button ${
                  activeTab === 'registered' ? 'active' : ''
                }`}
                onClick={() => setActiveTab('registered')}
              >
                Registered
              </button>
              <button
                className={`toggle-button ${
                  activeTab === 'history' ? 'active' : ''
                }`}
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
                <span className="empty-icon">*</span>
                <strong>
                  {activeTab === 'registered'
                    ? 'No registered activities yet'
                    : activeTab === 'history'
                      ? 'No activity history'
                      : 'No activities available'}
                </strong>
                <span>
                  {activeTab === 'registered'
                    ? 'Browse available sessions and register for ones that interest you.'
                    : activeTab === 'history'
                      ? 'Completed sessions will appear here once attendance is tracked.'
                      : 'Check back later for new sessions.'}
                </span>
                {activeTab !== 'upcoming' && (
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
                {filteredActivities.map((activity) => {
                  const isRegistered = registeredActivities.includes(activity.id)
                  const isSessionFull = activity.seatsLeft <= 0
                  const isSelected = selectedActivityId === activity.id

                  return (
                    <article
                      key={activity.id}
                      className={`match-card ${isSelected ? 'selected' : ''}`}
                    >
                      <div className="match-header">
                        <span className="activity-time">{activity.time}</span>
                        <span className="role-pill" data-variant="Participants">
                          Participant
                        </span>
                      </div>
                      <h3>{activity.title}</h3>
                      <p className="match-meta">
                        {formatDate(activity.date)} - {activity.location}
                      </p>
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
                          <span
                            style={{ width: `${getPercentFull(activity)}%` }}
                          />
                        </div>
                        <span className="activity-availability">
                          {activity.seatsLeft} of {activity.capacity} spots
                          available
                        </span>
                      </div>
                      <div className="activity-footer">
                        <Link className="button" href={`/activity/${activity.id}`}>
                          View details
                        </Link>
                        <button
                          className="button primary"
                          type="button"
                          onClick={() => handleSelectActivity(activity.id)}
                          disabled={isRegistered || isSessionFull}
                        >
                          {isRegistered
                            ? 'Registered'
                            : isSessionFull
                              ? 'Full'
                              : 'Register'}
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </div>

          <div className="detail-card" id="participant-registration">
            <h2>Register for a session</h2>
            <p className="detail-subtitle">
              Select a session, confirm your details, and submit to reserve your
              spot.
            </p>

            {!selectedActivity ? (
              <div className="empty-state">
                <strong>No session selected</strong>
                <span>Choose a session from the list to begin registration.</span>
              </div>
            ) : (
              <div className="selection-summary">
                <div>
                  <h3>{selectedActivity.title}</h3>
                  <p className="admin-meta">
                    {formatDate(selectedActivity.date)} at {selectedActivity.time} -{' '}
                    {selectedActivity.location}
                  </p>
                  <div className="activity-tags">
                    <span
                      className="activity-tag"
                      data-variant={selectedActivity.program}
                    >
                      {selectedActivity.program}
                    </span>
                    <span
                      className="activity-tag"
                      data-variant={selectedActivity.cadence}
                    >
                      {selectedActivity.cadence}
                    </span>
                  </div>
                </div>
                <div className="selection-side">
                  <span className="role-pill" data-variant="Participants">
                    Participant
                  </span>
                  {selectedActivity.seatsLeft <= 2 && (
                    <span
                      className="alert-pill"
                      data-variant={isFull ? 'full' : 'low'}
                    >
                      {isFull ? 'Full' : 'Low seats'}
                    </span>
                  )}
                </div>
              </div>
            )}

            <form className="form" onSubmit={handleRegister} noValidate>
              <div className="form-row">
                <label className="form-field">
                  <span className="form-label">Full name *</span>
                  <input
                    className="input"
                    type="text"
                    value={profile.name}
                    onChange={(event) =>
                      updateProfile('name', event.target.value)
                    }
                    placeholder="Enter full name"
                    disabled={!selectedActivity || isSubmitting}
                  />
                  {registrationErrors.name && (
                    <span className="form-error">{registrationErrors.name}</span>
                  )}
                </label>
                <label className="form-field">
                  <span className="form-label">Email address *</span>
                  <input
                    className="input"
                    type="email"
                    value={profile.email}
                    onChange={(event) =>
                      updateProfile('email', event.target.value)
                    }
                    placeholder="name@email.com"
                    disabled={!selectedActivity || isSubmitting}
                  />
                  {registrationErrors.email && (
                    <span className="form-error">{registrationErrors.email}</span>
                  )}
                </label>
              </div>

              <label className="form-field">
                <span className="form-label">Membership cadence *</span>
                <select
                  className="input"
                  value={profile.membership}
                  onChange={(event) =>
                    updateProfile(
                      'membership',
                      event.target.value as ParticipantProfile['membership']
                    )
                  }
                  disabled={!selectedActivity || isSubmitting}
                >
                  <option value="">Select cadence</option>
                  {membershipOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
                {registrationErrors.membership && (
                  <span className="form-error">
                    {registrationErrors.membership}
                  </span>
                )}
              </label>

              <div className="form-row">
                <label className="checkbox-field">
                  <input
                    type="checkbox"
                    checked={registrationDetails.accessibility}
                    onChange={(event) =>
                      updateRegistrationDetails(
                        'accessibility',
                        event.target.checked
                      )
                    }
                    disabled={!selectedActivity || isSubmitting}
                  />
                  <span>Accessibility support needed</span>
                </label>
                <label className="checkbox-field">
                  <input
                    type="checkbox"
                    checked={registrationDetails.caregiverPayment}
                    onChange={(event) =>
                      updateRegistrationDetails(
                        'caregiverPayment',
                        event.target.checked
                      )
                    }
                    disabled={!selectedActivity || isSubmitting}
                  />
                  <span>Caregiver payment required</span>
                </label>
              </div>

              <label className="form-field">
                <span className="form-label">Additional notes</span>
                <textarea
                  className="textarea"
                  rows={3}
                  value={registrationDetails.notes}
                  onChange={(event) =>
                    updateRegistrationDetails('notes', event.target.value)
                  }
                  placeholder="Share any support details or preferences."
                  disabled={!selectedActivity || isSubmitting}
                />
              </label>

              <div className="form-actions">
                <button
                  className="button primary"
                  type="submit"
                  disabled={
                    !selectedActivity || isFull || isSubmitting || !registrationReady
                  }
                >
                  {isFull
                    ? 'Session full'
                    : isSubmitting
                      ? 'Submitting...'
                      : 'Submit registration'}
                </button>
                <button
                  className="button"
                  type="button"
                  onClick={() =>
                    setRegistrationDetails({
                      accessibility: false,
                      caregiverPayment: false,
                      notes: '',
                    })
                  }
                  disabled={!selectedActivity || isSubmitting}
                >
                  Clear notes
                </button>
              </div>

              {registrationMessage && (
                <div
                  className={`status ${
                    registrationStatus === 'success' ? 'success' : 'error'
                  }`}
                >
                  {registrationMessage}
                </div>
              )}
            </form>

            <ul className="detail-list">
              <li>Confirm cadence and support details before submitting.</li>
              <li>Low capacity sessions may fill quickly.</li>
              <li>Registrations appear in your staff-managed attendance list.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="detail-grid reveal delay-2">
        <div className="detail-card">
          <h2>Your preferences</h2>
          <p className="detail-subtitle">
            Use these preferences to personalize the suggested sessions.
          </p>
          <div className="form">
            <label className="form-field">
              <span className="form-label">Preferred program type</span>
              <select
                className="input"
                value={profile.program}
                onChange={(event) =>
                  updateProfile('program', event.target.value as ProgramOption)
                }
              >
                {programOptions.map((option) => (
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
          <h2>Quick actions</h2>
          <p className="detail-subtitle">Common tasks and shortcuts.</p>
          <div className="detail-stack">
            <button
              type="button"
              className="detail-action"
              onClick={() => handleSelectActivity(selectedActivityId)}
            >
              <span className="detail-action-icon">01</span>
              <div>
                <strong>Jump to registration</strong>
                <span>Complete the registration panel</span>
              </div>
            </button>
            <Link href="/calendar" className="detail-action">
              <span className="detail-action-icon">02</span>
              <div>
                <strong>View full calendar</strong>
                <span>See all available sessions</span>
              </div>
            </Link>
            <div className="detail-action">
              <span className="detail-action-icon">03</span>
              <div>
                <strong>Activity report</strong>
                <span>Download your participation history</span>
              </div>
            </div>
          </div>
        </div>
      </section>

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
