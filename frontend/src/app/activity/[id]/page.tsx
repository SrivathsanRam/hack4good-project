'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

type Activity = {
  id: string
  title: string
  date: string
  startTime: string
  endTime: string
  location: string
  address?: string
  program: string
  roles: string[]
  type: string
  participantCapacity: number
  volunteerCapacity: number
  participantSeatsLeft: number
  volunteerSeatsLeft: number
  description: string
  imageUrl?: string
  wheelchairAccessible?: boolean
  paymentRequired?: boolean
  paymentAmount?: number
  coordinates?: {
    lat: number
    lng: number
  }
  // Legacy fields
  role?: string
  cadence?: string
  capacity?: number
  seatsLeft?: number
}

export default function ActivityDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const [activity, setActivity] = useState<Activity | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [relatedActivities, setRelatedActivities] = useState<Activity[]>([])
  const [relatedError, setRelatedError] = useState<string | null>(null)
  const [isRelatedLoading, setIsRelatedLoading] = useState(false)

  // Fetch activity from API
  useEffect(() => {
    const fetchActivity = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(`${apiBase}/api/activities/${params.id}`)
        if (!response.ok) {
          throw new Error('Activity not found')
        }
        const result = await response.json()
        setActivity(result.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load activity')
      } finally {
        setIsLoading(false)
      }
    }
    fetchActivity()
  }, [params.id])

  useEffect(() => {
    if (!activity) return

    let isMounted = true

    const loadRelated = async () => {
      setIsRelatedLoading(true)
      setRelatedError(null)

      try {
        const roles = activity.roles || (activity.role ? [activity.role] : [])
        const roleParam = roles[0] || 'Participant'
        
        const response = await fetch(
          `${apiBase}/api/activities?program=${encodeURIComponent(
            activity.program
          )}&role=${encodeURIComponent(roleParam)}`
        )
        if (!response.ok) {
          throw new Error('Failed to load related sessions')
        }
        const result = await response.json()
        const items = (result.data || []) as Activity[]
        const filtered = items.filter((item) => item.id !== activity.id)
        const sorted = filtered.sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.startTime || '00:00'}`)
          const dateB = new Date(`${b.date}T${b.startTime || '00:00'}`)
          return dateA.getTime() - dateB.getTime()
        })

        if (isMounted) {
          setRelatedActivities(sorted.slice(0, 3))
        }
      } catch (err) {
        if (isMounted) {
          setRelatedError(
            err instanceof Error ? err.message : 'Failed to load related sessions'
          )
          setRelatedActivities([])
        }
      } finally {
        if (isMounted) {
          setIsRelatedLoading(false)
        }
      }
    }

    loadRelated()

    return () => {
      isMounted = false
    }
  }, [activity])

  const formatDate = (isoDate: string) => {
    const date = new Date(`${isoDate}T00:00:00`)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatTime = (time: string) => {
    const safe = time || '00:00'
    const [hours, minutes] = safe.split(':')
    const hour = parseInt(hours, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const seatFill = useMemo(() => {
    if (!activity) return 0
    const capacity = activity.participantCapacity || activity.capacity || 0
    const seatsLeft = activity.participantSeatsLeft ?? activity.seatsLeft ?? 0
    return capacity > 0 ? Math.round(((capacity - seatsLeft) / capacity) * 100) : 0
  }, [activity])

  const isFull = useMemo(() => {
    if (!activity) return false
    const seatsLeft = activity.participantSeatsLeft ?? activity.seatsLeft ?? 0
    return seatsLeft <= 0
  }, [activity])

  const isLow = useMemo(() => {
    if (!activity) return false
    const seatsLeft = activity.participantSeatsLeft ?? activity.seatsLeft ?? 0
    return seatsLeft > 0 && seatsLeft <= 2
  }, [activity])

  const availabilityNote = isFull
    ? 'This session is currently full.'
    : isLow
      ? 'Only a few seats remain for this session.'
      : null

  if (isLoading) {
    return (
      <div className="container">
        <div className="status loading">
          <span className="spinner" aria-hidden="true" />
          Loading activity details...
        </div>
      </div>
    )
  }

  if (error || !activity) {
    return (
      <div className="container">
        <div className="status error">
          {error || 'Activity not found'}
          <Link className="button" href="/calendar">
            Back to calendar
          </Link>
        </div>
      </div>
    )
  }

  const roles = activity.roles || (activity.role ? [activity.role] : [])
  const activityType = activity.type || activity.cadence || 'One-off'
  const capacity = activity.participantCapacity || activity.capacity || 0
  const seatsLeft = activity.participantSeatsLeft ?? activity.seatsLeft ?? 0

  return (
    <div className="container">
      <section className="hero section-tight reveal">
        <div className="detail-stack">
          {activity.imageUrl && (
            <div style={{ 
              width: '100%', 
              maxHeight: '300px', 
              overflow: 'hidden', 
              borderRadius: '12px',
              marginBottom: '16px'
            }}>
              <img 
                src={activity.imageUrl} 
                alt={activity.title}
                style={{
                  width: '100%',
                  height: '300px',
                  objectFit: 'cover',
                  display: 'block'
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            </div>
          )}
          <div>
            <span className="badge">Activity details</span>
            <h1>{activity.title}</h1>
            <p>
              {formatDate(activity.date)} at {formatTime(activity.startTime)} - {formatTime(activity.endTime)} in{' '}
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
              <span className="info-value">{formatTime(activity.startTime)} - {formatTime(activity.endTime)}</span>
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
              {seatsLeft} of {capacity} seats left
            </span>
          </div>

          <div className="detail-tags">
            {roles.map(r => (
              <span key={r} className="detail-pill">{r}</span>
            ))}
            <span className="detail-pill">{seatsLeft} seats left</span>
            <span className="detail-pill">Capacity {capacity}</span>
            <span className="detail-pill">{activityType}</span>
            {activity.wheelchairAccessible && (
              <span className="detail-pill">♿ Wheelchair accessible</span>
            )}
            {activity.paymentRequired && (
              <span className="detail-pill">💰 ${activity.paymentAmount?.toFixed(2)}</span>
            )}
          </div>
          {availabilityNote && (
            <div className={`status ${isFull ? 'error' : 'warning'}`}>
              {availabilityNote}
            </div>
          )}
          
          {activity.address && (
            <div className="detail-card" style={{ marginTop: '16px' }}>
              <h3>Address</h3>
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ 
                  color: '#2563eb', 
                  textDecoration: 'underline',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                📍 {activity.address}
              </a>
            </div>
          )}
        </div>
        <div className="hero-card">
          <h3>Quick actions</h3>
          <p>Navigate to other sections or return to the calendar view.</p>
          <div className="hero-actions">
            <Link className="button" href="/calendar">
              Back to calendar
            </Link>
            <Link className="button primary" href="/participant">
              Participant view
            </Link>
          </div>
        </div>
      </section>

      <section className="section reveal delay-2">
        <div className="section-heading">
          <span className="section-eyebrow">Related sessions</span>
          <h2 className="section-title">More in this program</h2>
          <p className="section-subtitle">
            Explore other sessions in the {activity.program} program.
          </p>
        </div>

        {relatedError && <div className="status error">{relatedError}</div>}

        {isRelatedLoading ? (
          <div className="status loading">
            <span className="spinner" aria-hidden="true" />
            Loading related sessions...
          </div>
        ) : relatedActivities.length === 0 ? (
          <div className="empty-state">
            <strong>No related sessions yet</strong>
            <span>Check back for more sessions in this program.</span>
          </div>
        ) : (
          <div className="match-grid">
            {relatedActivities.map((item) => {
              const itemRoles = item.roles || (item.role ? [item.role] : [])
              const itemType = item.type || item.cadence || 'One-off'
              const itemSeatsLeft = item.participantSeatsLeft ?? item.seatsLeft ?? 0
              
              return (
                <article key={item.id} className="match-card">
                  <div className="match-header">
                    <span className="match-date">{formatDate(item.date)}</span>
                    <span className="match-time">
                      {formatTime(item.startTime)} - {formatTime(item.endTime)}
                    </span>
                  </div>
                  <h3 className="match-title">{item.title}</h3>
                  <p className="match-meta">{item.location}</p>
                  <div className="match-tags">
                    {itemRoles.map(r => (
                      <span key={r} className="match-tag">{r}</span>
                    ))}
                    <span className="match-tag">{itemType}</span>
                  </div>
                  <div className="match-footer">
                    <span className="match-seats">{itemSeatsLeft} seats left</span>
                    <Link className="button" href={`/activity/${item.id}`}>
                      View details
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

