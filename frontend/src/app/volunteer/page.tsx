'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

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
          <p>
            Keep your profile and cadence preferences up to date to get the best
            matches.
          </p>
          <div className="stat-row">
            <div className="stat-pill">
              <span className="stat-pill-value">{volunteerActivities.length}</span>
              <span className="stat-pill-label">Opportunities</span>
            </div>
            <div className="stat-pill">
              <span className="stat-pill-value">1</span>
              <span className="stat-pill-label">Checklist items left</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section reveal delay-1">
        <div className="section-heading">
          <span className="section-eyebrow">Suggested sessions</span>
          <h2 className="section-title">Priority matches for you</h2>
          <p className="section-subtitle">
            These opportunities align with your interests and availability.
          </p>
        </div>
        {isLoading ? (
          <div className="status loading">
            <span className="spinner" aria-hidden="true" />
            Loading volunteer opportunities...
          </div>
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
              <span className="form-label">Weekly cadence</span>
              <select className="input">
                <option>Ad hoc</option>
                <option>Once a week</option>
                <option>Twice a week</option>
                <option>Three or more</option>
              </select>
            </label>
            <div className="form-row">
              <label className="checkbox-field">
                <input type="checkbox" defaultChecked />
                <span>Morning sessions</span>
              </label>
              <label className="checkbox-field">
                <input type="checkbox" />
                <span>Afternoon sessions</span>
              </label>
            </div>
            <label className="form-field">
              <span className="form-label">Preferred program</span>
              <select className="input">
                <option>Movement</option>
                <option>Creative</option>
                <option>Caregiver sessions</option>
              </select>
            </label>
            <button className="button primary" type="button">
              Save preferences
            </button>
          </div>
        </div>
        <div className="detail-card">
          <h2>Onboarding checklist</h2>
          <p className="detail-subtitle">
            Complete these steps to start confirming sessions.
          </p>
          <div className="checklist">
            <label className="checkbox-field">
              <input type="checkbox" defaultChecked />
              <span>Volunteer profile completed</span>
            </label>
            <label className="checkbox-field">
              <input type="checkbox" defaultChecked />
              <span>Availability confirmed</span>
            </label>
            <label className="checkbox-field">
              <input type="checkbox" />
              <span>Background check submitted</span>
            </label>
          </div>
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
