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

type AttendanceRecord = {
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

const seedActivities: Activity[] = [
  {
    id: 'act-01',
    title: 'Morning Movement',
    date: '2024-04-10',
    time: '09:30',
    location: 'Studio A',
    program: 'Movement',
    role: 'Participants',
    capacity: 12,
    seatsLeft: 3,
    cadence: 'Weekly',
  },
  {
    id: 'act-02',
    title: 'Creative Collage Lab',
    date: '2024-04-10',
    time: '11:00',
    location: 'Art Room',
    program: 'Creative',
    role: 'Participants',
    capacity: 16,
    seatsLeft: 6,
    cadence: 'Weekly',
  },
  {
    id: 'act-03',
    title: 'Caregiver Circle',
    date: '2024-04-11',
    time: '14:00',
    location: 'Community Lounge',
    program: 'Caregiver sessions',
    role: 'Participants',
    capacity: 10,
    seatsLeft: 2,
    cadence: 'Ad hoc',
  },
  {
    id: 'act-04',
    title: 'Movement Support Volunteer',
    date: '2024-04-12',
    time: '09:00',
    location: 'Studio A',
    program: 'Movement',
    role: 'Volunteers',
    capacity: 4,
    seatsLeft: 1,
    cadence: 'Weekly',
  },
]

const seedAttendance: AttendanceRecord[] = [
  {
    id: 'att-01',
    activityId: 'act-01',
    name: 'Renee Tan',
    role: 'Participant',
    attended: false,
  },
  {
    id: 'att-02',
    activityId: 'act-01',
    name: 'Sameer Singh',
    role: 'Participant',
    attended: true,
  },
  {
    id: 'att-03',
    activityId: 'act-02',
    name: 'Kayla Lim',
    role: 'Participant',
    attended: false,
  },
  {
    id: 'att-04',
    activityId: 'act-04',
    name: 'Maya Chen',
    role: 'Volunteer',
    attended: true,
  },
]

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
  const [activities, setActivities] = useState<Activity[]>(seedActivities)
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(seedAttendance)
  const [form, setForm] = useState<ActivityFormState>(emptyForm)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [selectedActivityId, setSelectedActivityId] = useState(
    seedActivities[0]?.id || ''
  )

  useEffect(() => {
    if (!selectedActivityId && activities.length > 0) {
      setSelectedActivityId(activities[0].id)
      return
    }
    if (
      selectedActivityId &&
      activities.length > 0 &&
      !activities.some((activity) => activity.id === selectedActivityId)
    ) {
      setSelectedActivityId(activities[0].id)
    }
  }, [activities, selectedActivityId])

  const selectedActivity = useMemo(() => {
    return activities.find((activity) => activity.id === selectedActivityId)
  }, [activities, selectedActivityId])

  const visibleAttendance = useMemo(() => {
    return attendance.filter(
      (record) => record.activityId === selectedActivityId
    )
  }, [attendance, selectedActivityId])

  const checkedCount = visibleAttendance.filter((record) => record.attended).length

  const updateFormField = <Key extends keyof ActivityFormState>(
    key: Key,
    value: ActivityFormState[Key]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setSaveMessage(null)
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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaveMessage(null)

    if (!validate()) {
      return
    }

    const capacityValue = Number(form.capacity)

    if (editingId) {
      setActivities((prev) =>
        prev.map((activity) =>
          activity.id === editingId
            ? {
                ...activity,
                title: form.title,
                date: form.date,
                time: form.time,
                location: form.location,
                program: form.program,
                role: form.role as Activity['role'],
                capacity: capacityValue,
                seatsLeft: Math.min(activity.seatsLeft, capacityValue),
                cadence: form.cadence,
              }
            : activity
        )
      )
      setSaveMessage('Activity updated successfully.')
    } else {
      const newActivity: Activity = {
        id: `act-${Date.now()}`,
        title: form.title,
        date: form.date,
        time: form.time,
        location: form.location,
        program: form.program,
        role: form.role as Activity['role'],
        capacity: capacityValue,
        seatsLeft: capacityValue,
        cadence: form.cadence,
      }
      setActivities((prev) => [newActivity, ...prev])
      setSaveMessage('Activity created successfully.')
    }

    setForm(emptyForm)
    setFormErrors({})
    setEditingId(null)
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
  }

  const handleCancel = () => {
    setForm(emptyForm)
    setFormErrors({})
    setEditingId(null)
    setSaveMessage(null)
  }

  const toggleAttendance = (recordId: string) => {
    setAttendance((prev) =>
      prev.map((record) =>
        record.id === recordId
          ? { ...record, attended: !record.attended }
          : record
      )
    )
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
              <button className="button primary" type="submit">
                {editingId ? 'Save changes' : 'Create activity'}
              </button>
              <button className="button" type="button" onClick={handleCancel}>
                Clear form
              </button>
            </div>

            {saveMessage && <div className="status success">{saveMessage}</div>}
          </form>
        </div>

        <div className="detail-card">
          <h2>Upcoming activities</h2>
          <p className="detail-subtitle">
            Review the schedule and jump into edit mode when details change.
          </p>
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
                >
                  {activities.map((activity) => (
                    <option key={activity.id} value={activity.id}>
                      {activity.title}
                    </option>
                  ))}
                </select>
              </label>
              <button className="button" type="button" onClick={downloadCsv}>
                Download CSV
              </button>
            </div>
          </div>
          <p className="attendance-summary">
            {visibleAttendance.length > 0
              ? `${checkedCount} of ${visibleAttendance.length} checked in`
              : 'No registrations yet for this session.'}
          </p>
          {visibleAttendance.length === 0 ? (
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
                        onChange={() => toggleAttendance(record.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  )
}
