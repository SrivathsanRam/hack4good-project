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
  role: 'Participants' | 'Volunteers'
  capacity: number
  seatsLeft: number
  cadence: string
}

const sampleActivities: Activity[] = [
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
  {
    id: 'act-05',
    title: 'Creative Studio Setup',
    date: '2024-04-12',
    time: '10:30',
    location: 'Art Room',
    program: 'Creative',
    role: 'Volunteers',
    capacity: 6,
    seatsLeft: 2,
    cadence: 'Weekly',
  },
  {
    id: 'act-06',
    title: 'Afternoon Movement',
    date: '2024-04-13',
    time: '15:00',
    location: 'Studio B',
    program: 'Movement',
    role: 'Participants',
    capacity: 14,
    seatsLeft: 5,
    cadence: 'Twice weekly',
  },
]

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<'Month' | 'Week'>('Month')
  const [programFilter, setProgramFilter] = useState('All programs')
  const [roleFilter, setRoleFilter] = useState('All roles')

  const programOptions = [
    'All programs',
    'Movement',
    'Creative',
    'Caregiver sessions',
  ]
  const roleOptions = ['All roles', 'Participants', 'Volunteers']

  const filteredActivities = useMemo(() => {
    return sampleActivities.filter((activity) => {
      const matchesProgram =
        programFilter === 'All programs' || activity.program === programFilter
      const matchesRole = roleFilter === 'All roles' || activity.role === roleFilter
      return matchesProgram && matchesRole
    })
  }, [programFilter, roleFilter])

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
          <h3>Quick actions</h3>
          <p>Manage schedule visibility and registrations.</p>
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

      <section className="reveal delay-1">
        <div className="toolbar">
          <div className="toggle-group" role="tablist" aria-label="Calendar view">
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
          <span className="toolbar-note">
            {filteredActivities.length} activities matched
          </span>
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

        {filteredActivities.length === 0 ? (
          <div className="empty-state">
            <strong>No activities match those filters</strong>
            <span>Try switching to another program or role.</span>
          </div>
        ) : viewMode === 'Month' ? (
          <div className="calendar-month-grid">
            {groupedByDate.map(([date, items]) => (
              <div key={date} className="day-panel">
                <div className="day-title">{formatDay(date)}</div>
                <div className="day-cards">
                  {items.map((activity) => (
                    <article key={activity.id} className="activity-card">
                      <div>
                        <h3>{activity.title}</h3>
                        <p className="activity-meta">
                          {activity.time} - {activity.location}
                        </p>
                      </div>
                      <div className="activity-tags">
                        <span className="activity-tag">{activity.program}</span>
                        <span className="activity-tag">{activity.role}</span>
                        <span className="activity-tag">{activity.cadence}</span>
                      </div>
                      <div className="activity-footer">
                        <span>{activity.seatsLeft} seats left</span>
                        <Link
                          href={`/activity/${activity.id}`}
                          className="button"
                        >
                          View details
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="calendar-week-list">
            {groupedByDate.map(([date, items]) => (
              <div key={date} className="week-row">
                <div className="day-title">{formatDay(date)}</div>
                <div className="week-cards">
                  {items.map((activity) => (
                    <article key={activity.id} className="activity-card">
                      <div>
                        <h3>{activity.title}</h3>
                        <p className="activity-meta">
                          {activity.time} - {activity.location}
                        </p>
                      </div>
                      <div className="activity-tags">
                        <span className="activity-tag">{activity.program}</span>
                        <span className="activity-tag">{activity.role}</span>
                      </div>
                      <div className="activity-footer">
                        <span>{activity.seatsLeft} seats left</span>
                        <Link
                          href={`/activity/${activity.id}`}
                          className="button"
                        >
                          View details
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}


