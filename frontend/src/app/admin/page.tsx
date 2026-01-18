'use client'

import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'

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
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [attendanceError, setAttendanceError] = useState<string | null>(null)
  const [attendanceMessage, setAttendanceMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<ActivityFormState>(emptyForm)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'error'>('idle')
  const [selectedActivityId, setSelectedActivityId] = useState('')
  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>([])
  const [bulkMessage, setBulkMessage] = useState<string | null>(null)
  const [bulkStatus, setBulkStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle')

  const loadAttendance = useCallback(
    async (activityId: string) => {
      if (!activityId) return
      setAttendanceError(null)
      setAttendanceMessage(null)
      try {
        const response = await fetch(
          `${apiBase}/api/registrations?activityId=${activityId}`
        )
        if (!response.ok) throw new Error('Failed to fetch registrations')
        const result = await response.json()
        setAttendance(
          (result.data || []).map((r: any) => ({
            id: r.id,
            activityId: r.activityId,
            name: r.name,
            role: r.role,
            attended: r.attended,
          }))
        )
      } catch (err) {
        setAttendanceError(
          err instanceof Error ? err.message : 'Failed to load attendance.'
        )
        setAttendance([])
      }
    },
    [apiBase]
  )

  // Fetch activities from API
  useEffect(() => {
    const fetchActivities = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(`${apiBase}/api/activities`)
        if (!response.ok) throw new Error('Failed to fetch activities')
        const result = await response.json()
        const data = result.data || []
        setActivities(data)
        if (data.length > 0 && !selectedActivityId) {
          setSelectedActivityId(data[0].id)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load activities')
        setActivities([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchActivities()
  }, [])

  useEffect(() => {
    setSelectedActivityIds((prev) =>
      prev.filter((id) => activities.some((activity) => activity.id === id))
    )
  }, [activities])

  // Fetch attendance when selected activity changes
  useEffect(() => {
    loadAttendance(selectedActivityId)
  }, [loadAttendance, selectedActivityId])

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

  const totalCapacity = activities.reduce(
    (sum, activity) => sum + activity.capacity,
    0
  )
  const seatsUsed = activities.reduce(
    (sum, activity) => sum + Math.max(activity.capacity - activity.seatsLeft, 0),
    0
  )
  const utilizationRate =
    totalCapacity > 0 ? Math.round((seatsUsed / totalCapacity) * 100) : 0
  const openSeats = activities.reduce(
    (sum, activity) => sum + Math.max(activity.seatsLeft, 0),
    0
  )

  const programSummary = useMemo(() => {
    const programLabels = ['Movement', 'Creative', 'Caregiver sessions']
    const counts = programLabels.map((program) => ({
      label: program,
      count: activities.filter((activity) => activity.program === program).length,
    }))
    const total = counts.reduce((sum, item) => sum + item.count, 0)
    return counts.map((item) => ({
      ...item,
      percent: total > 0 ? Math.round((item.count / total) * 100) : 0,
    }))
  }, [activities])

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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaveMessage(null)
    setSaveStatus('idle')

    if (!validate()) {
      return
    }

    setSaveStatus('saving')
    const capacityValue = Number(form.capacity)

    try {
      if (editingId) {
        // Update existing activity
        const response = await fetch(`${apiBase}/api/activities/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: form.title,
            date: form.date,
            time: form.time,
            location: form.location,
            program: form.program,
            role: form.role,
            capacity: capacityValue,
            cadence: form.cadence,
          }),
        })
        if (!response.ok) throw new Error('Failed to update activity')
        const result = await response.json()
        setActivities((prev) =>
          prev.map((activity) =>
            activity.id === editingId ? result.data : activity
          )
        )
        setSaveMessage('Activity updated successfully.')
      } else {
        // Create new activity
        const response = await fetch(`${apiBase}/api/activities`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: form.title,
            date: form.date,
            time: form.time,
            location: form.location,
            program: form.program,
            role: form.role,
            capacity: capacityValue,
            cadence: form.cadence,
            description: 'Newly scheduled session for the coming week.',
          }),
        })
        if (!response.ok) throw new Error('Failed to create activity')
        const result = await response.json()
        setActivities((prev) => [result.data, ...prev])
        setSaveMessage('Activity created successfully.')
      }
      setSaveStatus('idle')
      setForm(emptyForm)
      setFormErrors({})
      setEditingId(null)
    } catch (err) {
      setSaveStatus('error')
      setSaveMessage(err instanceof Error ? err.message : 'Failed to save activity')
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
  }

  const handleCancel = () => {
    setForm(emptyForm)
    setFormErrors({})
    setEditingId(null)
    setSaveMessage(null)
  }

  const toggleActivitySelection = (activityId: string) => {
    setSelectedActivityIds((prev) =>
      prev.includes(activityId)
        ? prev.filter((id) => id !== activityId)
        : [...prev, activityId]
    )
    setBulkMessage(null)
    setBulkStatus('idle')
  }

  const selectAllActivities = () => {
    setSelectedActivityIds(activities.map((activity) => activity.id))
    setBulkMessage(null)
    setBulkStatus('idle')
  }

  const clearSelection = () => {
    setSelectedActivityIds([])
    setBulkMessage(null)
    setBulkStatus('idle')
  }

  const applyBulkCapacity = async (increment: number) => {
    if (selectedActivityIds.length === 0) return
    setBulkStatus('running')
    setBulkMessage(null)

    try {
      const results = await Promise.allSettled(
        selectedActivityIds.map(async (id) => {
          const activity = activities.find((item) => item.id === id)
          if (!activity) {
            throw new Error('Activity not found.')
          }
          const nextCapacity = Math.max(activity.capacity + increment, 1)
          const response = await fetch(`${apiBase}/api/activities/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ capacity: nextCapacity }),
          })
          if (!response.ok) {
            throw new Error('Failed to update activity.')
          }
          const result = await response.json()
          return result.data as Activity
        })
      )

      const updated = results.flatMap((result) =>
        result.status === 'fulfilled' ? [result.value] : []
      )
      const failures = results.filter((result) => result.status === 'rejected').length

      if (updated.length > 0) {
        setActivities((prev) =>
          prev.map(
            (activity) =>
              updated.find((item) => item.id === activity.id) || activity
          )
        )
      }

      if (failures > 0) {
        setBulkStatus('error')
        setBulkMessage(`${failures} updates failed. Review and try again.`)
      } else {
        setBulkStatus('success')
        setBulkMessage('Capacity updated for selected sessions.')
      }
    } catch (err) {
      setBulkStatus('error')
      setBulkMessage(err instanceof Error ? err.message : 'Bulk update failed.')
    }
  }

  const applyBulkDelete = async () => {
    if (selectedActivityIds.length === 0) return
    const confirmed = window.confirm(
      `Delete ${selectedActivityIds.length} activities? This cannot be undone.`
    )
    if (!confirmed) return

    setBulkStatus('running')
    setBulkMessage(null)

    const results = await Promise.allSettled(
      selectedActivityIds.map((id) =>
        fetch(`${apiBase}/api/activities/${id}`, { method: 'DELETE' })
      )
    )

    const deletedIds: string[] = []
    const failedIds: string[] = []

    results.forEach((result, index) => {
      const id = selectedActivityIds[index]
      if (result.status === 'fulfilled' && result.value.ok) {
        deletedIds.push(id)
      } else {
        failedIds.push(id)
      }
    })

    const remainingActivities = activities.filter(
      (activity) => !deletedIds.includes(activity.id)
    )
    setActivities(remainingActivities)
    setSelectedActivityIds(failedIds)

    if (selectedActivityId && deletedIds.includes(selectedActivityId)) {
      setSelectedActivityId(remainingActivities[0]?.id ?? '')
      setAttendance([])
    }

    if (failedIds.length > 0) {
      setBulkStatus('error')
      setBulkMessage(`${failedIds.length} deletions failed. Try again.`)
    } else {
      setBulkStatus('success')
      setBulkMessage('Selected activities deleted.')
    }
  }

  const toggleAttendance = async (recordId: string) => {
    const record = attendance.find((r) => r.id === recordId)
    if (!record) return

    const newAttended = !record.attended
    setAttendanceMessage(null)
    
    // Optimistic update
    setAttendance((prev) =>
      prev.map((r) =>
        r.id === recordId ? { ...r, attended: newAttended } : r
      )
    )

    try {
      const response = await fetch(`${apiBase}/api/registrations/${recordId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attended: newAttended }),
      })
      if (!response.ok) {
        // Revert on failure
        setAttendance((prev) =>
          prev.map((r) =>
            r.id === recordId ? { ...r, attended: !newAttended } : r
          )
        )
        setAttendanceError('Failed to update attendance. Please try again.')
        return
      }
      setAttendanceError(null)
    } catch (err) {
      // Revert on error
      setAttendance((prev) =>
        prev.map((r) =>
          r.id === recordId ? { ...r, attended: !newAttended } : r
        )
      )
      setAttendanceError('Failed to update attendance. Please try again.')
    }
  }

  const handleBulkAttendance = async (attended: boolean) => {
    if (visibleAttendance.length === 0) return

    setAttendanceError(null)
    setAttendanceMessage(null)

    setAttendance((prev) =>
      prev.map((record) =>
        record.activityId === selectedActivityId ? { ...record, attended } : record
      )
    )

    try {
      const results = await Promise.allSettled(
        visibleAttendance.map((record) =>
          fetch(`${apiBase}/api/registrations/${record.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ attended }),
          })
        )
      )

      const failed = results.filter((result) => {
        if (result.status === 'rejected') {
          return true
        }
        return !result.value.ok
      }).length

      if (failed > 0) {
        setAttendanceError('Some attendance updates failed. Please try again.')
        loadAttendance(selectedActivityId)
        return
      }

      setAttendanceMessage(
        `Attendance updated for ${visibleAttendance.length} registrations.`
      )
    } catch (err) {
      setAttendanceError('Failed to update attendance. Please try again.')
      loadAttendance(selectedActivityId)
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
      {isLoading && (
        <div className="status loading">
          <span className="spinner" aria-hidden="true" />
          Loading activities...
        </div>
      )}

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
        <div className="insight-grid">
          <div className="insight-card">
            <span className="insight-title">Capacity utilization</span>
            <span className="insight-value">{utilizationRate}%</span>
            <span className="insight-meta">
              {seatsUsed} of {totalCapacity} seats in use.
            </span>
          </div>
          <div className="insight-card">
            <span className="insight-title">Open seats</span>
            <span className="insight-value">{openSeats}</span>
            <span className="insight-meta">
              Remaining capacity across all sessions.
            </span>
          </div>
          <div className="insight-card">
            <span className="insight-title">Low capacity alerts</span>
            <span className="insight-value">{lowCapacitySessions.length}</span>
            <span className="insight-meta">
              Sessions with two or fewer seats left.
            </span>
          </div>
          <div className="insight-card">
            <span className="insight-title">Program mix</span>
            {activities.length === 0 ? (
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
              {participantSessions} participant, {volunteerSessions} volunteer.
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
              <button className="button primary" type="submit">
                {editingId ? 'Save changes' : 'Create activity'}
              </button>
              <button className="button" type="button" onClick={handleCancel}>
                Clear form
              </button>
            </div>

            {saveMessage && (
              <div className={`status ${saveStatus === 'error' ? 'error' : 'success'}`}>
                {saveMessage}
              </div>
            )}
          </form>
        </div>

        <div className="detail-card">
          <h2>Upcoming activities</h2>
          <p className="detail-subtitle">
            Review the schedule and jump into edit mode when details change.
          </p>
          <div className="bulk-toolbar">
            <div className="bulk-info">
              <span className="bulk-count">{selectedActivityIds.length} selected</span>
              <span className="bulk-meta">Select sessions to apply bulk actions.</span>
            </div>
            <div className="bulk-actions">
              <button
                className="button"
                type="button"
                onClick={selectAllActivities}
                disabled={activities.length === 0 || bulkStatus === 'running'}
              >
                Select all
              </button>
              <button
                className="button ghost"
                type="button"
                onClick={clearSelection}
                disabled={selectedActivityIds.length === 0 || bulkStatus === 'running'}
              >
                Clear
              </button>
              <button
                className="button ghost"
                type="button"
                onClick={() => applyBulkCapacity(2)}
                disabled={selectedActivityIds.length === 0 || bulkStatus === 'running'}
              >
                Add 2 seats
              </button>
              <button
                className="button"
                type="button"
                onClick={applyBulkDelete}
                disabled={selectedActivityIds.length === 0 || bulkStatus === 'running'}
              >
                Delete
              </button>
            </div>
          </div>
          {bulkMessage && (
            <div
              className={`status ${bulkStatus === 'error' ? 'error' : 'success'}`}
            >
              {bulkMessage}
            </div>
          )}
          {activities.length === 0 ? (
            <div className="empty-state">
              <strong>No activities yet</strong>
              <span>Create one to populate the schedule.</span>
            </div>
          ) : (
            <div className="admin-list">
              {activities.map((activity) => (
                <div key={activity.id} className="admin-item">
                  <label className="selection-control">
                    <input
                      type="checkbox"
                      checked={selectedActivityIds.includes(activity.id)}
                      onChange={() => toggleActivitySelection(activity.id)}
                      aria-label={`Select ${activity.title}`}
                    />
                  </label>
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
          {attendanceMessage && (
            <div className="status success">{attendanceMessage}</div>
          )}
          {attendanceError && (
            <div className="status error">{attendanceError}</div>
          )}
          {visibleAttendance.length > 0 && (
            <div className="bulk-toolbar compact">
              <div className="bulk-info">
                <span className="bulk-count">{visibleAttendance.length} records</span>
                <span className="bulk-meta">Update attendance in one pass.</span>
              </div>
              <div className="bulk-actions">
                <button
                  className="button"
                  type="button"
                  onClick={() => handleBulkAttendance(true)}
                >
                  Mark all present
                </button>
                <button
                  className="button ghost"
                  type="button"
                  onClick={() => handleBulkAttendance(false)}
                >
                  Mark all absent
                </button>
              </div>
            </div>
          )}
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
