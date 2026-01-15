'use client'

import { type FormEvent, useEffect, useMemo, useState } from 'react'

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

type Registration = {
  id: string
  activityId: string
  name: string
  role: 'Participant' | 'Volunteer'
  attended: boolean
}

type ActivityFormState = {
  title: string
  date: string
  time: string
  location: string
  program: string
  role: '' | 'Participants' | 'Volunteers'
  cadence: string
  capacity: string
}

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

const emptyForm: ActivityFormState = {
  title: '',
  date: '',
  time: '',
  location: '',
  program: '',
  role: '',
  cadence: '',
  capacity: '',
}

export default function AdminPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [attendance, setAttendance] = useState<Registration[]>([])
  const [form, setForm] = useState<ActivityFormState>(emptyForm)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>(
    'idle'
  )
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [selectedActivityId, setSelectedActivityId] = useState('')
  const [activitiesLoading, setActivitiesLoading] = useState(true)
  const [activitiesError, setActivitiesError] = useState<string | null>(null)
  const [attendanceLoading, setAttendanceLoading] = useState(false)
  const [attendanceError, setAttendanceError] = useState<string | null>(null)
  const [activitiesRefreshKey, setActivitiesRefreshKey] = useState(0)
  const [attendanceRefreshKey, setAttendanceRefreshKey] = useState(0)

  useEffect(() => {
    let isActive = true

    const loadActivities = async () => {
      setActivitiesLoading(true)
      setActivitiesError(null)

      try {
        const response = await fetch(`${apiBase}/api/activities`)
        if (!response.ok) {
          throw new Error('Unable to load activities. Please try again.')
        }
        const payload = await response.json()
        const data = Array.isArray(payload?.data) ? payload.data : []

        if (isActive) {
          setActivities(data)
        }
      } catch (loadError) {
        if (isActive) {
          const message =
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load activities. Please try again.'
          setActivitiesError(message)
        }
      } finally {
        if (isActive) {
          setActivitiesLoading(false)
        }
      }
    }

    void loadActivities()

    return () => {
      isActive = false
    }
  }, [apiBase, activitiesRefreshKey])

  useEffect(() => {
    if (activities.length === 0) {
      setSelectedActivityId('')
      return
    }

    if (!selectedActivityId) {
      setSelectedActivityId(activities[0].id)
      return
    }

    if (!activities.some((activity) => activity.id === selectedActivityId)) {
      setSelectedActivityId(activities[0].id)
    }
  }, [activities, selectedActivityId])

  useEffect(() => {
    if (!selectedActivityId) {
      setAttendance([])
      setAttendanceLoading(false)
      setAttendanceError(null)
      return
    }

    let isActive = true

    const loadAttendance = async () => {
      setAttendanceLoading(true)
      setAttendanceError(null)

      try {
        const response = await fetch(
          `${apiBase}/api/registrations?activityId=${selectedActivityId}`
        )
        if (!response.ok) {
          throw new Error('Unable to load attendance. Please try again.')
        }
        const payload = await response.json()
        const data = Array.isArray(payload?.data) ? payload.data : []

        if (isActive) {
          setAttendance(data)
        }
      } catch (loadError) {
        if (isActive) {
          const message =
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load attendance. Please try again.'
          setAttendanceError(message)
        }
      } finally {
        if (isActive) {
          setAttendanceLoading(false)
        }
      }
    }

    void loadAttendance()

    return () => {
      isActive = false
    }
  }, [apiBase, attendanceRefreshKey, selectedActivityId])

  const selectedActivity = useMemo(() => {
    return activities.find((activity) => activity.id === selectedActivityId)
  }, [activities, selectedActivityId])

  const nextSession = useMemo(() => {
    const sorted = [...activities].sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time || '00:00'}`)
      const dateB = new Date(`${b.date}T${b.time || '00:00'}`)
      return dateA.getTime() - dateB.getTime()
    })
    return sorted[0]
  }, [activities])

  const visibleAttendance = useMemo(() => {
    return attendance.filter(
      (record) => record.activityId === selectedActivityId
    )
  }, [attendance, selectedActivityId])

  const checkedCount = visibleAttendance.filter((record) => record.attended).length
  const attendanceRate =
    visibleAttendance.length > 0
      ? Math.round((checkedCount / visibleAttendance.length) * 100)
      : 0
  const participantSessions = activities.filter(
    (activity) => activity.role === 'Participants'
  ).length
  const volunteerSessions = activities.filter(
    (activity) => activity.role === 'Volunteers'
  ).length
  const lowCapacitySessions = useMemo(() => {
    return activities.filter((activity) => activity.seatsLeft <= 2)
  }, [activities])

  const updateFormField = <Key extends keyof ActivityFormState>(
    key: Key,
    value: ActivityFormState[Key]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setSaveMessage(null)
    setSaveError(null)
    setSaveStatus('idle')
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {}
    if (!form.title.trim()) {
      nextErrors.title = 'Title is required.'
    }
    if (!form.date) {
      nextErrors.date = 'Date is required.'
    }
    if (!form.time) {
      nextErrors.time = 'Time is required.'
    }
    if (!form.location.trim()) {
      nextErrors.location = 'Location is required.'
    }
    if (!form.program) {
      nextErrors.program = 'Program is required.'
    }
    if (!form.role) {
      nextErrors.role = 'Role is required.'
    }
    if (!form.cadence) {
      nextErrors.cadence = 'Cadence is required.'
    }
    const capacityValue = Number(form.capacity)
    if (!form.capacity || Number.isNaN(capacityValue) || capacityValue <= 0) {
      nextErrors.capacity = 'Capacity must be a positive number.'
    }

    setFormErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaveMessage(null)
    setSaveError(null)

    if (!validate()) {
      return
    }

    setSaveStatus('saving')

    const capacityValue = Number(form.capacity)
    const payload = {
      title: form.title,
      date: form.date,
      time: form.time,
      location: form.location,
      program: form.program,
      role: form.role,
      cadence: form.cadence,
      capacity: capacityValue,
    }

    try {
      const response = await fetch(
        editingId
          ? `${apiBase}/api/activities/${editingId}`
          : `${apiBase}/api/activities`,
        {
          method: editingId ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      )

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null)
        const message =
          errorPayload?.error || 'Unable to save activity. Please try again.'
        throw new Error(message)
      }

      setSaveStatus('success')
      setSaveMessage(
        editingId ? 'Activity updated successfully.' : 'Activity created successfully.'
      )
      setForm(emptyForm)
      setFormErrors({})
      setEditingId(null)
      setActivitiesRefreshKey((value) => value + 1)
    } catch (saveFailure) {
      const message =
        saveFailure instanceof Error
          ? saveFailure.message
          : 'Unable to save activity. Please try again.'
      setSaveStatus('error')
      setSaveError(message)
    }
  }

  const handleEdit = (activity: Activity) => {
    setEditingId(activity.id)
    setForm({
      title: activity.title,
      date: activity.date,
      time: activity.time,
      location: activity.location,
      program: activity.program,
      role: activity.role,
      cadence: activity.cadence,
      capacity: String(activity.capacity),
    })
    setSaveMessage(null)
    setSaveError(null)
    setSaveStatus('idle')
  }

  const handleCancel = () => {
    setForm(emptyForm)
    setFormErrors({})
    setEditingId(null)
    setSaveMessage(null)
    setSaveError(null)
    setSaveStatus('idle')
  }

  const toggleAttendance = async (record: Registration) => {
    const nextValue = !record.attended

    setAttendance((prev) =>
      prev.map((item) =>
        item.id === record.id ? { ...item, attended: nextValue } : item
      )
    )

    try {
      const response = await fetch(
        `${apiBase}/api/registrations/${record.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ attended: nextValue }),
        }
      )

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null)
        const message =
          errorPayload?.error || 'Unable to update attendance. Please try again.'
        throw new Error(message)
      }
    } catch (toggleError) {
      const message =
        toggleError instanceof Error
          ? toggleError.message
          : 'Unable to update attendance. Please try again.'
      setAttendanceError(message)
      setAttendanceRefreshKey((value) => value + 1)
    }
  }

  const downloadCsv = () => {
    if (!selectedActivity) {
      return
    }

    const rows = [
      ['Activity', 'Name', 'Role', 'Attended'],
      ...visibleAttendance.map((record) => [
        selectedActivity.title,
        record.name,
        record.role,
        record.attended ? 'Yes' : 'No',
      ]),
    ]

    const csv = rows
      .map((row) =>
        row
          .map((field) =>
            `"${String(field).replace(/"/g, '""')}"`
          )
          .join(',')
      )
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `attendance-${selectedActivity.id}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="container">
      <section className="hero section-tight reveal">
        <div>
          <span className="badge">Staff console</span>
          <h1>Plan schedules and confirm attendance</h1>
          <p>
            Draft weekly activities, capture nuanced registration details, and
            export attendance in minutes.
          </p>
        </div>
        <div className="hero-card">
          <h3>Staff focus</h3>
          <p>Keep the schedule clean and let the platform handle reminders.</p>
        </div>
      </section>

      <section className="section reveal delay-1">
        <div className="section-heading">
          <span className="section-eyebrow">Weekly snapshot</span>
          <h2 className="section-title">Schedule health at a glance</h2>
          <p className="section-subtitle">
            Monitor coverage, registrations, and upcoming sessions.
          </p>
        </div>
        <div className="kpi-grid">
          <div className="kpi-card">
            <span className="kpi-label">Total sessions</span>
            <span className="kpi-value">{activities.length}</span>
            <span className="kpi-foot">
              {participantSessions} participant, {volunteerSessions} volunteer
            </span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Attendance check-ins</span>
            <span className="kpi-value">{attendanceRate}%</span>
            <span className="kpi-foot">
              {checkedCount} of {visibleAttendance.length} in this session
            </span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Next session</span>
            <span className="kpi-value">
              {nextSession ? nextSession.title : 'No sessions'}
            </span>
            <span className="kpi-foot">
              {nextSession
                ? `${nextSession.date} at ${nextSession.time}`
                : 'Add a session to get started.'}
            </span>
          </div>
        </div>
      </section>

      <section className="detail-grid reveal delay-1">
        <div className="detail-card">
          <h2>{editingId ? 'Update activity' : 'Create a new activity'}</h2>
          <p className="detail-subtitle">
            Required fields are marked. Edits update the activity list on the
            right.
          </p>
          <form className="form" onSubmit={handleSubmit} noValidate>
            <div className="form-row">
              <label className="form-field">
                <span className="form-label">Title *</span>
                <input
                  className="input"
                  type="text"
                  value={form.title}
                  onChange={(event) =>
                    updateFormField('title', event.target.value)
                  }
                  placeholder="Activity title"
                />
                {formErrors.title && (
                  <span className="form-error">{formErrors.title}</span>
                )}
              </label>
              <label className="form-field">
                <span className="form-label">Program *</span>
                <select
                  className="input"
                  value={form.program}
                  onChange={(event) =>
                    updateFormField('program', event.target.value)
                  }
                >
                  <option value="">Select program</option>
                  <option value="Movement">Movement</option>
                  <option value="Creative">Creative</option>
                  <option value="Caregiver sessions">Caregiver sessions</option>
                </select>
                {formErrors.program && (
                  <span className="form-error">{formErrors.program}</span>
                )}
              </label>
            </div>

            <div className="form-row">
              <label className="form-field">
                <span className="form-label">Date *</span>
                <input
                  className="input"
                  type="date"
                  value={form.date}
                  onChange={(event) => updateFormField('date', event.target.value)}
                />
                {formErrors.date && (
                  <span className="form-error">{formErrors.date}</span>
                )}
              </label>
              <label className="form-field">
                <span className="form-label">Time *</span>
                <input
                  className="input"
                  type="time"
                  value={form.time}
                  onChange={(event) => updateFormField('time', event.target.value)}
                />
                {formErrors.time && (
                  <span className="form-error">{formErrors.time}</span>
                )}
              </label>
            </div>

            <div className="form-row">
              <label className="form-field">
                <span className="form-label">Location *</span>
                <input
                  className="input"
                  type="text"
                  value={form.location}
                  onChange={(event) =>
                    updateFormField('location', event.target.value)
                  }
                  placeholder="Location"
                />
                {formErrors.location && (
                  <span className="form-error">{formErrors.location}</span>
                )}
              </label>
              <label className="form-field">
                <span className="form-label">Capacity *</span>
                <input
                  className="input"
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={(event) =>
                    updateFormField('capacity', event.target.value)
                  }
                  placeholder="0"
                />
                {formErrors.capacity && (
                  <span className="form-error">{formErrors.capacity}</span>
                )}
              </label>
            </div>

            <div className="form-row">
              <label className="form-field">
                <span className="form-label">Role *</span>
                <select
                  className="input"
                  value={form.role}
                  onChange={(event) => updateFormField('role', event.target.value)}
                >
                  <option value="">Select role</option>
                  <option value="Participants">Participants</option>
                  <option value="Volunteers">Volunteers</option>
                </select>
                {formErrors.role && (
                  <span className="form-error">{formErrors.role}</span>
                )}
              </label>
              <label className="form-field">
                <span className="form-label">Cadence *</span>
                <select
                  className="input"
                  value={form.cadence}
                  onChange={(event) =>
                    updateFormField('cadence', event.target.value)
                  }
                >
                  <option value="">Select cadence</option>
                  <option value="Ad hoc">Ad hoc</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Twice weekly">Twice weekly</option>
                </select>
                {formErrors.cadence && (
                  <span className="form-error">{formErrors.cadence}</span>
                )}
              </label>
            </div>

            <div className="form-actions">
              <button
                className="button primary"
                type="submit"
                disabled={saveStatus === 'saving'}
              >
                {saveStatus === 'saving'
                  ? 'Saving...'
                  : editingId
                    ? 'Save changes'
                    : 'Create activity'}
              </button>
              <button className="button" type="button" onClick={handleCancel}>
                Clear form
              </button>
            </div>

            {saveMessage && <div className="status success">{saveMessage}</div>}
            {saveStatus === 'error' && saveError && (
              <div className="status error">{saveError}</div>
            )}
          </form>
        </div>

        <div className="detail-card">
          <h2>Upcoming activities</h2>
          <p className="detail-subtitle">
            Review the schedule and jump into edit mode when details change.
          </p>
          {activitiesLoading ? (
            <div className="status loading">
              <span className="spinner" aria-hidden="true" />
              Loading activities...
            </div>
          ) : activitiesError ? (
            <div className="status error">
              {activitiesError}
              <button
                className="button"
                type="button"
                onClick={() => setActivitiesRefreshKey((value) => value + 1)}
              >
                Try again
              </button>
            </div>
          ) : activities.length === 0 ? (
            <div className="empty-state">
              <strong>No activities yet</strong>
              <span>Create one to populate the schedule.</span>
            </div>
          ) : (
            <div className="admin-list">
              {activities.map((activity) => (
                <div key={activity.id} className="admin-item">
                  <div>
                    <h3>{activity.title}</h3>
                    <p className="admin-meta">
                      {activity.date} at {activity.time} - {activity.location}
                    </p>
                    <div className="activity-tags">
                      <span className="activity-tag">{activity.program}</span>
                      <span className="activity-tag">{activity.role}</span>
                      <span className="activity-tag">
                        Capacity {activity.capacity}
                      </span>
                    </div>
                  </div>
                  <div className="admin-actions">
                    <button
                      className="button"
                      type="button"
                      onClick={() => handleEdit(activity)}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="detail-grid reveal delay-2">
        <div className="detail-card">
          <div className="attendance-toolbar">
            <div>
              <h2>Attendance tracker</h2>
              <p className="detail-subtitle">
                Mark attendance and export CSV for reporting.
              </p>
            </div>
            <div className="attendance-controls">
              <label className="form-field">
                <span className="form-label">Session</span>
                <select
                  className="input"
                  value={selectedActivityId}
                  onChange={(event) => setSelectedActivityId(event.target.value)}
                  disabled={activities.length === 0}
                >
                  {activities.map((activity) => (
                    <option key={activity.id} value={activity.id}>
                      {activity.title}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="button"
                type="button"
                onClick={downloadCsv}
                disabled={!selectedActivity}
              >
                Download CSV
              </button>
            </div>
          </div>
          <p className="attendance-summary">
            {visibleAttendance.length > 0
              ? `${checkedCount} of ${visibleAttendance.length} checked in`
              : 'No registrations yet for this session.'}
          </p>
          {attendanceLoading ? (
            <div className="status loading">
              <span className="spinner" aria-hidden="true" />
              Loading attendance...
            </div>
          ) : attendanceError ? (
            <div className="status error">
              {attendanceError}
              <button
                className="button"
                type="button"
                onClick={() => setAttendanceRefreshKey((value) => value + 1)}
              >
                Try again
              </button>
            </div>
          ) : visibleAttendance.length === 0 ? (
            <div className="empty-state">
              <strong>No attendance records</strong>
              <span>Registrations will appear here once submitted.</span>
            </div>
          ) : (
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Attended</th>
                </tr>
              </thead>
              <tbody>
                {visibleAttendance.map((record) => (
                  <tr key={record.id}>
                    <td>{record.name}</td>
                    <td>{record.role}</td>
                    <td>
                      <input
                        type="checkbox"
                        checked={record.attended}
                        onChange={() => toggleAttendance(record)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="detail-card">
          <h2>Capacity alerts</h2>
          <p className="detail-subtitle">
            Sessions that are close to full this week.
          </p>
          {lowCapacitySessions.length === 0 ? (
            <div className="empty-state">
              <strong>No alerts</strong>
              <span>All sessions still have healthy capacity.</span>
            </div>
          ) : (
            <div className="risk-list">
              {lowCapacitySessions.map((activity) => (
                <div key={activity.id} className="risk-item">
                  <div>
                    <h3>{activity.title}</h3>
                    <p className="admin-meta">
                      {activity.date} at {activity.time} - {activity.location}
                    </p>
                    <span className="alert-pill" data-variant="low">
                      {activity.seatsLeft} seats left
                    </span>
                  </div>
                  <span className="role-pill" data-variant={activity.role}>
                    {activity.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
