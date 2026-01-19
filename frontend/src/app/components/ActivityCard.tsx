'use client'

import Link from 'next/link'

export interface Activity {
  id: string
  title: string
  date: string
  startTime: string
  endTime: string
  location: string
  address?: string
  program: string
  roles: string[] // ['Participant', 'Volunteer', 'Volunteers Only']
  type: string // renamed from cadence
  participantCapacity: number
  volunteerCapacity: number
  participantSeatsLeft: number
  volunteerSeatsLeft: number
  imageUrl?: string
  wheelchairAccessible?: boolean
  paymentRequired?: boolean
  paymentAmount?: number
  staffPresent?: string[]
  contactIC?: string
  coordinates?: {
    lat: number
    lng: number
  }
  // Legacy fields for backwards compatibility
  role?: string
  cadence?: string
  capacity?: number
  seatsLeft?: number
}

interface ActivityCardProps {
  activity: Activity
  isFiltered?: boolean // If true, activity is grayed out (doesn't match filters)
  compact?: boolean // For calendar cell view
  onClick?: (activity: Activity) => void // If provided, triggers this instead of navigation
}

export default function ActivityCard({ activity, isFiltered = false, compact = false, onClick }: ActivityCardProps) {
  // Support both new and legacy field names
  const capacity = activity.participantCapacity || activity.capacity || 0
  const seatsLeft = activity.participantSeatsLeft ?? activity.seatsLeft ?? 0
  const activityType = activity.type || activity.cadence || 'One-off'
  const roles = activity.roles || (activity.role ? [activity.role] : [])
  
  const getSeatFill = () => {
    if (!capacity) return 0
    const used = Math.max(capacity - seatsLeft, 0)
    return Math.min(used / capacity, 1)
  }

  const seatFill = Math.round(getSeatFill() * 100)
  const isFull = seatsLeft <= 0
  const isLow = seatsLeft > 0 && seatsLeft <= 2
  const availabilityLabel = isFull
    ? 'Full'
    : isLow
      ? 'Low seats'
      : `${seatsLeft} seats left`

  const formatTime = (time: string) => {
    const safe = time || '00:00'
    const [hours, minutes] = safe.split(':')
    const hour = parseInt(hours, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault()
      onClick(activity)
    }
  }

  const isVolunteersOnly = roles.includes('Volunteers Only')

  if (compact) {
    if (onClick) {
      return (
        <button
          type="button"
          onClick={handleClick}
          className={`activity-compact ${isFiltered ? 'filtered' : ''} ${isFull ? 'full' : ''} ${isVolunteersOnly ? 'volunteers-only' : ''}`}
          title={`${activity.title} - ${formatTime(activity.startTime)} to ${formatTime(activity.endTime)}`}
        >
          {activity.imageUrl && (
            <img 
              src={activity.imageUrl} 
              alt="" 
              className="activity-compact-image"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          )}
          <span className="activity-compact-time">{formatTime(activity.startTime)}</span>
          <span className="activity-compact-title">{activity.title}</span>
          {activity.wheelchairAccessible && (
            <span className="accessibility-icon" title="Wheelchair accessible">♿</span>
          )}
        </button>
      )
    }
    return (
      <Link 
        href={`/activity/${activity.id}`}
        className={`activity-compact ${isFiltered ? 'filtered' : ''} ${isFull ? 'full' : ''} ${isVolunteersOnly ? 'volunteers-only' : ''}`}
        title={`${activity.title} - ${formatTime(activity.startTime)} to ${formatTime(activity.endTime)}`}
      >
        {activity.imageUrl && (
          <img 
            src={activity.imageUrl} 
            alt="" 
            className="activity-compact-image"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        )}
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
      {activity.imageUrl && (
        <div className="activity-card-image">
          <img 
            src={activity.imageUrl} 
            alt={activity.title}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        </div>
      )}
      <div className="activity-header">
        <div>
          <span className="activity-time">
            {formatTime(activity.startTime)} - {formatTime(activity.endTime)}
          </span>
          <h3>{activity.title}</h3>
          <p className="activity-meta">{activity.location}</p>
        </div>
        <div className="activity-side">
          {roles.map(r => (
            <span key={r} className="role-pill" data-variant={r}>
              {r}
            </span>
          ))}
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
        <span className="activity-tag" data-variant={activityType}>
          {activityType}
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
          {seatsLeft} of {capacity} seats left
        </span>
      </div>
      <div className="activity-footer">
        <span className="activity-availability">{availabilityLabel}</span>
        {onClick ? (
          <button className="button" onClick={handleClick}>
            View details
          </button>
        ) : (
          <Link href={`/activity/${activity.id}`} className="button">
            View details
          </Link>
        )}
      </div>
    </article>
  )
}
