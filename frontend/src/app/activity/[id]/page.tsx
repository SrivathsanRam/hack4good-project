'use client'

import Link from 'next/link'
import { type FormEvent, useEffect, useState } from 'react'

type Activity = {
  id: string
  title: string
  date: string
  time: string
  location: string
  program: string
  seatsLeft: number
  capacity: number
  cadence?: string
  description?: string
}

type FormState = {
  name: string
  email: string
  role: '' | 'Participant' | 'Volunteer'
  membership: '' | 'Ad hoc' | 'Once a week' | 'Twice a week' | 'Three or more'
  accessibility: boolean
  caregiverPayment: boolean
  notes: string
}

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function ActivityDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const [activity, setActivity] = useState<Activity | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    role: '',
    membership: '',
    accessibility: false,
    caregiverPayment: false,
    notes: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitStatus, setSubmitStatus] = useState<
    'idle' | 'submitting' | 'success' | 'error'
  >('idle')
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true

    const loadActivity = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`${apiBase}/api/activities/${params.id}`)
        if (!response.ok) {
          throw new Error('Unable to load activity details. Please try again.')
        }
        const payload = await response.json()
        const data = payload?.data

        if (isActive) {
          if (!data) {
            throw new Error('Activity data is missing.')
          }
          setActivity(data)
        }
      } catch (loadError) {
        if (isActive) {
          const message =
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load activity details. Please try again.'
          setError(message)
          setActivity(null)
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadActivity()

    return () => {
      isActive = false
    }
  }, [apiBase, params.id])

  const updateField = <Key extends keyof FormState>(
    key: Key,
    value: FormState[Key]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {}
    if (!form.name.trim()) {
      nextErrors.name = 'Name is required.'
    }
    if (!form.email.trim()) {
      nextErrors.email = 'Email is required.'
    } else if (!/^[^@]+@[^@]+\.[^@]+$/.test(form.email)) {
      nextErrors.email = 'Enter a valid email.'
    }
    if (!form.role) {
      nextErrors.role = 'Select a role to continue.'
    }
    if (!form.membership) {
      nextErrors.membership = 'Select a membership cadence.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const formatDate = (isoDate: string) => {
    const date = new Date(`${isoDate}T00:00:00`)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const requiredFields = [
    { label: 'Name', value: form.name.trim() },
    { label: 'Email', value: form.email.trim() },
    { label: 'Role', value: form.role },
    { label: 'Cadence', value: form.membership },
  ]
  const completedSteps = requiredFields.filter((field) => field.value).length
  const progressPercent =
    requiredFields.length > 0
      ? Math.round((completedSteps / requiredFields.length) * 100)
      : 0

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!activity || submitStatus === 'submitting') {
      return
    }

    setSubmitStatus('idle')
    setSubmitError(null)

    if (!validate()) {
      return
    }

    setSubmitStatus('submitting')

    try {
      const response = await fetch(`${apiBase}/api/registrations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activityId: activity.id,
          name: form.name,
          email: form.email,
          role: form.role,
          membership: form.membership,
          accessibility: form.accessibility,
          caregiverPayment: form.caregiverPayment,
          notes: form.notes,
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        const message = payload?.error || 'Unable to submit registration.'
        throw new Error(message)
      }

      setSubmitStatus('success')
    } catch (submitFailure) {
      const message =
        submitFailure instanceof Error
          ? submitFailure.message
          : 'Unable to submit registration.'
      setSubmitError(message)
      setSubmitStatus('error')
    }
  }

  if (isLoading) {
    return (
      <div className="container">
        <div className="status loading">
          <span className="spinner" aria-hidden="true" />
          Loading activity details from the API...
        </div>
      </div>
    )
  }

  if (!activity || error) {
    return (
      <div className="container">
        <section className="hero section-tight reveal">
          <div>
            <span className="badge">Activity details</span>
            <h1>Activity unavailable</h1>
            <p>We could not load this session right now.</p>
          </div>
          <div className="hero-card">
            <h3>Next step</h3>
            <p>Return to the calendar and choose another session.</p>
            <div className="hero-actions">
              <Link className="button primary" href="/calendar">
                Back to calendar
              </Link>
            </div>
          </div>
        </section>
        <div className="status error">{error || 'Activity not found.'}</div>
      </div>
    )
  }

  const seatFill =
    activity.capacity > 0
      ? Math.round(
          ((activity.capacity - activity.seatsLeft) / activity.capacity) * 100
        )
      : 0

  return (
    <div className="container">
      <section className="hero section-tight reveal">
        <div className="detail-stack">
          <div>
            <span className="badge">Activity details</span>
            <h1>{activity.title}</h1>
            <p>
              {formatDate(activity.date)} at {activity.time} in{' '}
              {activity.location}. Program: {activity.program}.
            </p>
            {activity.description && <p>{activity.description}</p>}
          </div>

          <div className="info-grid">
            <div className="info-card">
              <span className="info-label">Date</span>
              <span className="info-value">{formatDate(activity.date)}</span>
            </div>
            <div className="info-card">
              <span className="info-label">Time</span>
              <span className="info-value">{activity.time}</span>
            </div>
            <div className="info-card">
              <span className="info-label">Location</span>
              <span className="info-value">{activity.location}</span>
            </div>
            <div className="info-card">
              <span className="info-label">Program</span>
              <span className="info-value">{activity.program}</span>
            </div>
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

          <div className="detail-tags">
            <span className="detail-pill">{activity.seatsLeft} seats left</span>
            <span className="detail-pill">Capacity {activity.capacity}</span>
            {activity.cadence && (
              <span className="detail-pill">{activity.cadence}</span>
            )}
          </div>
        </div>
        <div className="hero-card">
          <h3>Registration checklist</h3>
          <p>Confirm role, cadence, and any support notes before you submit.</p>
          <div className="hero-actions">
            <Link className="button" href="/calendar">
              Back to calendar
            </Link>
          </div>
        </div>
      </section>

      <section className="detail-grid reveal delay-1">
        <div className="detail-card">
          <h2>Register for this session</h2>
          <p className="detail-subtitle">
            Required fields are marked. A confirmation banner appears after
            submission.
          </p>
          <form className="form" onSubmit={handleSubmit} noValidate>
            <div className="form-progress">
              <div className="progress-meta">
                <span>Registration progress</span>
                <span>
                  {completedSteps} of {requiredFields.length} complete
                </span>
              </div>
              <div
                className="meter"
                role="progressbar"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <span style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
            <div className="form-row">
              <label className="form-field">
                <span className="form-label">Full name *</span>
                <input
                  className="input"
                  type="text"
                  value={form.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  placeholder="Enter full name"
                />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </label>
              <label className="form-field">
                <span className="form-label">Email address *</span>
                <input
                  className="input"
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  placeholder="name@email.com"
                />
                {errors.email && <span className="form-error">{errors.email}</span>}
              </label>
            </div>

            <div className="form-field">
              <span className="form-label">Role *</span>
              <div className="radio-group">
                {(['Participant', 'Volunteer'] as const).map((role) => (
                  <label key={role} className="radio-option">
                    <input
                      type="radio"
                      name="role"
                      value={role}
                      checked={form.role === role}
                      onChange={() => updateField('role', role)}
                    />
                    <span>{role}</span>
                  </label>
                ))}
              </div>
              {errors.role && <span className="form-error">{errors.role}</span>}
            </div>

            <div className="form-field">
              <span className="form-label">Membership cadence *</span>
              <div className="radio-group">
                {([
                  'Ad hoc',
                  'Once a week',
                  'Twice a week',
                  'Three or more',
                ] as const).map((option) => (
                  <label key={option} className="radio-option">
                    <input
                      type="radio"
                      name="membership"
                      value={option}
                      checked={form.membership === option}
                      onChange={() => updateField('membership', option)}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
              {errors.membership && (
                <span className="form-error">{errors.membership}</span>
              )}
            </div>

            <div className="form-row">
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={form.accessibility}
                  onChange={(event) =>
                    updateField('accessibility', event.target.checked)
                  }
                />
                <span>Accessibility support needed</span>
              </label>
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={form.caregiverPayment}
                  onChange={(event) =>
                    updateField('caregiverPayment', event.target.checked)
                  }
                />
                <span>Caregiver payment required</span>
              </label>
            </div>

            <label className="form-field">
              <span className="form-label">Additional notes</span>
              <textarea
                className="textarea"
                rows={4}
                value={form.notes}
                onChange={(event) => updateField('notes', event.target.value)}
                placeholder="Share any support details or preferences."
              />
            </label>

            <div className="form-actions">
              <button
                className="button primary"
                type="submit"
                disabled={submitStatus === 'submitting'}
              >
                {submitStatus === 'submitting'
                  ? 'Submitting...'
                  : 'Submit registration'}
              </button>
              <button
                className="button"
                type="button"
                onClick={() => {
                  setForm({
                    name: '',
                    email: '',
                    role: '',
                    membership: '',
                    accessibility: false,
                    caregiverPayment: false,
                    notes: '',
                  })
                  setErrors({})
                  setSubmitStatus('idle')
                  setSubmitError(null)
                }}
              >
                Clear form
              </button>
            </div>

            {submitStatus === 'success' && (
              <div className="status success">
                Registration saved. A confirmation message will be sent soon.
              </div>
            )}
            {submitStatus === 'error' && (
              <div className="status error">{submitError}</div>
            )}
          </form>
        </div>

        <aside className="detail-card summary-card">
          <h2>Registration summary</h2>
          <p className="detail-subtitle">
            Confirm the details you are about to submit.
          </p>
          <dl className="summary-list">
            <div className="summary-row">
              <dt>Role</dt>
              <dd>{form.role || 'Not selected'}</dd>
            </div>
            <div className="summary-row">
              <dt>Cadence</dt>
              <dd>{form.membership || 'Not selected'}</dd>
            </div>
            <div className="summary-row">
              <dt>Accessibility</dt>
              <dd>{form.accessibility ? 'Yes' : 'No'}</dd>
            </div>
            <div className="summary-row">
              <dt>Caregiver payment</dt>
              <dd>{form.caregiverPayment ? 'Required' : 'Not needed'}</dd>
            </div>
          </dl>
          <div className="empty-state">
            <strong>No conflicts detected</strong>
            <span>Membership rules will be enforced after submission.</span>
          </div>
          <p className="summary-note">
            Staff will review support notes before the session begins.
          </p>
        </aside>
      </section>
    </div>
  )
}
