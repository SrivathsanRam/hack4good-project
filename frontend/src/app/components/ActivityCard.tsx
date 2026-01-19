'use client'

import Link from 'next/link'

export interface Activity {
  id: string
  title: string
  date: string
  startTime: string
  endTime: string
  location: string
  program: string
  role: string
  cadence: string
  capacity: number
  seatsLeft: number
  wheelchairAccessible?: boolean
  paymentRequired?: boolean
  paymentAmount?: number
  coordinates?: {
    lat: number
    lng: number
  }
}

interface ActivityCardProps {
  activity: Activity
  isFiltered?: boolean // If true, activity is grayed out (doesn't match filters)
  compact?: boolean // For calendar cell view
}

export default function ActivityCard({ activity, isFiltered = false, compact = false }: ActivityCardProps) {
  const getSeatFill = () => {
    if (!activity.capacity) return 0
    const used = Math.max(activity.capacity - activity.seatsLeft, 0)
    return Math.min(used / activity.capacity, 1)
  }

  const seatFill = Math.round(getSeatFill() * 100)
  const isFull = activity.seatsLeft <= 0
  const isLow = activity.seatsLeft > 0 && activity.seatsLeft <= 2
  const availabilityLabel = isFull
    ? 'Full'
    : isLow
      ? 'Low seats'
      : `${activity.seatsLeft} seats left`

  const formatTime = (time: string) => {
    const safe = time || '00:00'
    const [hours, minutes] = safe.split(':')
    const hour = parseInt(hours, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  if (compact) {
    return (
      <Link 
        href={`/activity/${activity.id}`}
        className={`activity-compact ${isFiltered ? 'filtered' : ''} ${isFull ? 'full' : ''}`}
        title={`${activity.title} - ${formatTime(activity.startTime)} to ${formatTime(activity.endTime)}`}
      >
        <span className="activity-compact-time">{formatTime(activity.startTime)}</span>
        <span className="activity-compact-title">{activity.title}</span>
        {activity.wheelchairAccessible && (
          <span className="accessibility-icon" title="Wheelchair accessible">♿</span>
        )}
      </Link>
    )
  }

  return (
    <article className={`activity-card ${isFiltered ? 'filtered' : ''}`}>
      <div className="activity-header">
        <div>
          <span className="activity-time">
            {formatTime(activity.startTime)} - {formatTime(activity.endTime)}
          </span>
          <h3>{activity.title}</h3>
          <p className="activity-meta">{activity.location}</p>
        </div>
        <div className="activity-side">
          <span className="role-pill" data-variant={activity.role}>
            {activity.role}
          </span>
          {(isLow || isFull) && (
            <span
              className="alert-pill"
              data-variant={isFull ? 'full' : 'low'}
            >
              {availabilityLabel}
            </span>
          )}
        </div>
      </div>
      <div className="activity-tags">
        <span className="activity-tag" data-variant={activity.program}>
          {activity.program}
        </span>
        <span className="activity-tag" data-variant={activity.cadence}>
          {activity.cadence}
        </span>
        {activity.wheelchairAccessible && (
          <span className="activity-tag accessible">♿ Accessible</span>
        )}
        {activity.paymentRequired && (
          <span className="activity-tag payment">
            💰 ${activity.paymentAmount?.toFixed(2)}
          </span>
        )}
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
      <div className="activity-footer">
        <span className="activity-availability">{availabilityLabel}</span>
        <Link href={`/activity/${activity.id}`} className="button">
          View details
        </Link>
      </div>
    </article>
  )
}
