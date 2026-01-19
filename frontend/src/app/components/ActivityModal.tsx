'use client'

import { useEffect, useRef } from 'react'
import { Activity } from './ActivityCard'

interface ActivityModalProps {
  activity: Activity | null
  onClose: () => void
  onRegister?: (activity: Activity) => void
  onUnregister?: (activity: Activity) => void
  isRegistered?: boolean
  registering?: boolean
  unregistering?: boolean
  userRole?: 'volunteer' | 'participant' // Which role is the user viewing as
  // For participant features
  userHomeCoordinates?: { lat: number; lng: number }
  userMobilityStatus?: string
  registeredActivities?: Activity[] // For timing clash detection
}

export default function ActivityModal({
  activity,
  onClose,
  onRegister,
  onUnregister,
  isRegistered = false,
  registering = false,
  unregistering = false,
  userRole = 'participant',
  userHomeCoordinates,
  userMobilityStatus,
  registeredActivities = [],
}: ActivityModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    if (activity) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [activity, onClose])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  if (!activity) return null

  const formatTime = (time: string) => {
    const safe = time || '00:00'
    const [hours, minutes] = safe.split(':')
    const hour = parseInt(hours, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const formatDate = (isoDate: string) => {
    const date = new Date(`${isoDate}T00:00:00`)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Support both old fields and new fields, use role-appropriate capacities
  const isVolunteerView = userRole === 'volunteer'
  const totalSeats = isVolunteerView 
    ? (activity.volunteerCapacity ?? activity.capacity ?? 0)
    : (activity.participantCapacity ?? activity.capacity ?? 0)
  const availableSeats = isVolunteerView
    ? (activity.volunteerSeatsLeft ?? activity.seatsLeft ?? 0)
    : (activity.participantSeatsLeft ?? activity.seatsLeft ?? 0)
  const isFull = availableSeats <= 0
  const isLow = availableSeats > 0 && availableSeats <= 2
  const seatFill = totalSeats > 0
    ? Math.round(((totalSeats - availableSeats) / totalSeats) * 100)
    : 0
  
  const actionLabel = isVolunteerView ? 'Commit' : 'Register'
  const actioningLabel = isVolunteerView ? 'Committing...' : 'Registering...'
  const unactionLabel = isVolunteerView ? 'Withdraw Commitment' : 'Unregister'
  const unactioningLabel = isVolunteerView ? 'Withdrawing...' : 'Unregistering...'
  const registeredLabel = isVolunteerView ? "✓ You're committed" : "✓ You're registered"
  const capacityLabel = isVolunteerView ? 'Volunteer Spots' : 'Availability'

  // Generate Google Maps directions URL
  const getDirectionsUrl = () => {
    // Use coordinates if available, otherwise use location/address text
    const destination = activity.coordinates 
      ? `${activity.coordinates.lat},${activity.coordinates.lng}`
      : encodeURIComponent(activity.address || activity.location || '')
    
    if (!destination) return null
    
    // If user has home coordinates, use them as origin
    if (userHomeCoordinates) {
      const origin = `${userHomeCoordinates.lat},${userHomeCoordinates.lng}`
      return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=transit`
    }
    
    // Otherwise just open the destination in Google Maps (user's current location will be used)
    return `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=transit`
  }
  const directionsUrl = getDirectionsUrl()

  // Check for timing clashes with registered activities
  const getTimingClash = () => {
    if (isRegistered || registeredActivities.length === 0) return null
    
    const activityStart = new Date(`${activity.date}T${activity.startTime || '00:00'}`)
    const activityEnd = new Date(`${activity.date}T${activity.endTime || '23:59'}`)
    
    for (const reg of registeredActivities) {
      if (reg.date !== activity.date) continue
      
      const regStart = new Date(`${reg.date}T${reg.startTime || '00:00'}`)
      const regEnd = new Date(`${reg.date}T${reg.endTime || '23:59'}`)
      
      // Check for overlap
      if (activityStart < regEnd && activityEnd > regStart) {
        return reg
      }
    }
    return null
  }
  const clashingActivity = getTimingClash()

  // Check mobility compatibility
  const getMobilityIssue = () => {
    if (isVolunteerView || isRegistered) return null
    if (!userMobilityStatus) return null
    
    // If user cannot walk or cannot walk long distances, they need wheelchair accessible venues
    const needsAccessibility = userMobilityStatus === 'cannot walk' || userMobilityStatus === 'cannot walk long distances'
    if (needsAccessibility && !activity.wheelchairAccessible) {
      return 'This venue is not wheelchair accessible'
    }
    return null
  }
  const mobilityIssue = getMobilityIssue()

  const canRegister = !isFull && !clashingActivity && !mobilityIssue

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content" ref={modalRef} role="dialog" aria-modal="true">
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          ✕
        </button>

        <div className="modal-header">
          <div className="modal-badges">
            <span className="badge" data-variant={activity.program}>
              {activity.program}
            </span>
            <span className="badge" data-variant={activity.roles?.[0] || activity.role}>
              {activity.roles?.join(', ') || activity.role}
            </span>
            {activity.wheelchairAccessible && (
              <span className="badge accessible">♿ Accessible</span>
            )}
            {activity.paymentRequired && (
              <span className="badge payment">💰 ${activity.paymentAmount?.toFixed(2)}</span>
            )}
          </div>
          <h2 className="modal-title">{activity.title}</h2>
        </div>

        <div className="modal-body">
          <div className="modal-info-grid">
            <div className="modal-info-item">
              <span className="info-label">📅 Date</span>
              <span className="info-value">{formatDate(activity.date)}</span>
            </div>
            <div className="modal-info-item">
              <span className="info-label">🕐 Time</span>
              <span className="info-value">
                {formatTime(activity.startTime)} - {formatTime(activity.endTime)}
              </span>
            </div>
            <div className="modal-info-item">
              <span className="info-label">📍 Location</span>
              <span className="info-value">{activity.location}</span>
            </div>
            <div className="modal-info-item">
              <span className="info-label">🔄 Type</span>
              <span className="info-value">{activity.type || activity.cadence || 'One-off'}</span>
            </div>
          </div>

          <div className="modal-capacity">
            <div className="capacity-header">
              <span className="capacity-label">{capacityLabel}</span>
              <span className={`capacity-status ${isFull ? 'full' : isLow ? 'low' : ''}`}>
                {isFull ? 'Full' : isLow ? 'Almost full' : `${availableSeats} spots available`}
              </span>
            </div>
            <div className="capacity-bar">
              <div 
                className="capacity-fill" 
                style={{ width: `${seatFill}%` }}
                data-status={isFull ? 'full' : isLow ? 'low' : 'available'}
              />
            </div>
            <span className="capacity-text">
              {totalSeats - availableSeats} of {totalSeats} spots filled
            </span>
          </div>
        </div>

        <div className="modal-footer">
          {/* Validation warnings */}
          {clashingActivity && !isRegistered && (
            <div className="modal-warning">
              ⚠️ Time clash with "{clashingActivity.title}" ({clashingActivity.startTime} - {clashingActivity.endTime})
            </div>
          )}
          {mobilityIssue && !isRegistered && (
            <div className="modal-warning">
              ♿ {mobilityIssue}
            </div>
          )}
          
          <div className="modal-footer-buttons">
            {directionsUrl && (
              <a 
                href={directionsUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="button directions"
                onClick={(e) => e.stopPropagation()}
              >
                🧭 Directions
              </a>
            )}
            {isRegistered ? (
              <div className="registered-actions">
                <span className="registered-badge">{registeredLabel}</span>
                {onUnregister && (
                  <button
                    className="button danger"
                    onClick={() => onUnregister(activity)}
                    disabled={unregistering}
                  >
                    {unregistering ? unactioningLabel : unactionLabel}
                  </button>
                )}
              </div>
            ) : onRegister && canRegister ? (
              <button
                className="button primary"
                onClick={() => onRegister(activity)}
                disabled={registering}
              >
                {registering ? actioningLabel : `${actionLabel} for this activity`}
              </button>
            ) : isFull ? (
              <span className="full-badge">This activity is full</span>
            ) : (clashingActivity || mobilityIssue) ? (
              <span className="full-badge">Cannot register for this activity</span>
            ) : null}
            <button className="button outline" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
