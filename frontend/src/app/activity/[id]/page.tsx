'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

type Activity = {
  id: string
  title: string
  date: string
  time: string
  location: string
  program: string
  seatsLeft: number
  capacity: number
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

const sampleActivityById: Record<string, Activity> = {
  'act-01': {
    id: 'act-01',
    title: 'Morning Movement',
    date: 'Apr 10, 2024',
    time: '09:30',
    location: 'Studio A',
    program: 'Movement',
    seatsLeft: 3,
    capacity: 12,
  },
  'act-02': {
    id: 'act-02',
    title: 'Creative Collage Lab',
    date: 'Apr 10, 2024',
    time: '11:00',
    location: 'Art Room',
    program: 'Creative',
    seatsLeft: 6,
    capacity: 16,
  },
  'act-03': {
    id: 'act-03',
    title: 'Caregiver Circle',
    date: 'Apr 11, 2024',
    time: '14:00',
    location: 'Community Lounge',
    program: 'Caregiver sessions',
    seatsLeft: 2,
    capacity: 10,
  },
}

export default function ActivityDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const activity = useMemo(() => {
    return (
      sampleActivityById[params.id] || {
        id: params.id,
        title: 'Community Activity',
        date: 'Apr 14, 2024',
        time: '10:00',
        location: 'Main Hall',
        program: 'Community',
        seatsLeft: 8,
        capacity: 15,
      }
    )
  }, [params.id])

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
  const [submitted, setSubmitted] = useState(false)

  const updateField = <Key extends keyof FormState>(key: Key, value: FormState[Key]) => {
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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(false)
    if (validate()) {
      setSubmitted(true)
    }
  }

  return (
    <div className="container">
      <section className="hero section-tight reveal">
        <div>
          <span className="badge">Activity details</span>
          <h1>{activity.title}</h1>
          <p>
            {activity.date} at {activity.time} in {activity.location}. Program:{' '}
            {activity.program}.
          </p>
          <div className="detail-tags">
            <span className="detail-pill">{activity.seatsLeft} seats left</span>
            <span className="detail-pill">Capacity {activity.capacity}</span>
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
                {(['Ad hoc', 'Once a week', 'Twice a week', 'Three or more'] as const).map(
                  (option) => (
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
                  )
                )}
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
              <button className="button primary" type="submit">
                Submit registration
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
                  setSubmitted(false)
                }}
              >
                Clear form
              </button>
            </div>

            {submitted && (
              <div className="status success">
                Registration saved. A confirmation message will be sent soon.
              </div>
            )}
          </form>
        </div>

        <aside className="detail-card">
          <h2>Need help deciding?</h2>
          <p className="detail-subtitle">
            Staff can review special requests before the session begins.
          </p>
          <ul className="detail-list">
            <li>Share accessibility notes early.</li>
            <li>Confirm caregiver payment details.</li>
            <li>Volunteer coverage is limited by capacity.</li>
          </ul>
          <div className="empty-state" style={{ marginTop: '20px' }}>
            <strong>No conflicts detected</strong>
            <span>Membership rules will be enforced after submission.</span>
          </div>
        </aside>
      </section>
    </div>
  )
}
