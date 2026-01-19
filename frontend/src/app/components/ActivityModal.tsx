'use client'

import { useEffect, useRef } from 'react'
import { Activity } from './ActivityCard'

interface ActivityModalProps {
  activity: Activity | null
  onClose: () => void
  onRegister?: (activity: Activity) => void
  isRegistered?: boolean
  registering?: boolean
}

export default function ActivityModal({
  activity,
  onClose,
  onRegister,
  isRegistered = false,
  registering = false,
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

  // Support both old fields and new fields
  const totalSeats = activity.participantCapacity ?? activity.volunteerCapacity ?? activity.capacity ?? 0
  const availableSeats = activity.participantSeatsLeft ?? activity.volunteerSeatsLeft ?? activity.seatsLeft ?? 0
  const isFull = availableSeats <= 0
  const isLow = availableSeats > 0 && availableSeats <= 2
  const seatFill = totalSeats > 0
    ? Math.round(((totalSeats - availableSeats) / totalSeats) * 100)
    : 0

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
              <span className="info-label">🔄 Cadence</span>
              <span className="info-value">{activity.cadence}</span>
            </div>
          </div>

          <div className="modal-capacity">
            <div className="capacity-header">
              <span className="capacity-label">Availability</span>
              <span className={`capacity-status ${isFull ? 'full' : isLow ? 'low' : ''}`}>
                {isFull ? 'Full' : isLow ? 'Almost full' : `${availableSeats} seats available`}
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
          {isRegistered ? (
            <span className="registered-badge">✓ You're registered</span>
          ) : onRegister && !isFull ? (
            <button
              className="button primary"
              onClick={() => onRegister(activity)}
              disabled={registering}
            >
              {registering ? 'Registering...' : 'Register for this activity'}
            </button>
          ) : isFull ? (
            <span className="full-badge">This activity is full</span>
          ) : null}
          <button className="button outline" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
