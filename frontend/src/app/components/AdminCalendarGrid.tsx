'use client'

import { useMemo, useState } from 'react'
import { Activity } from './ActivityCard'
import { ActivityTemplate } from './ActivityTemplateModal'

interface AdminCalendarGridProps {
  activities: Activity[] // For future use - sync checking
  scheduledActivities: Map<string, ActivityTemplate[]> // dateKey -> activities
  onDropActivity: (dateKey: string, template: ActivityTemplate) => void
  onRemoveActivity: (dateKey: string, activityId: string) => void
  onActivityClick?: (dateKey: string, template: ActivityTemplate) => void
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/120x80/e8f4ea/3d6d5a?text=Activity'

export default function AdminCalendarGrid({
  activities: _activities, // eslint-disable-line @typescript-eslint/no-unused-vars
  scheduledActivities,
  onDropActivity,
  onRemoveActivity,
  onActivityClick,
}: AdminCalendarGridProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [dragOverDate, setDragOverDate] = useState<string | null>(null)

  // Get calendar days for the current month view (Monday start)
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    // Get Monday before (or on) the first day
    const startDate = new Date(firstDay)
    const dayOfWeek = startDate.getDay()
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Adjust for Monday start
    startDate.setDate(startDate.getDate() - diff)

    // End on Sunday after (or on) the last day
    const endDate = new Date(lastDay)
    const endDayOfWeek = endDate.getDay()
    const endDiff = endDayOfWeek === 0 ? 0 : 7 - endDayOfWeek
    endDate.setDate(endDate.getDate() + endDiff)

    const days: Date[] = []
    const current = new Date(startDate)

    while (current <= endDate) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    return days
  }, [currentDate])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const isToday = (date: Date) => date.toDateString() === today.toDateString()
  const isCurrentMonth = (date: Date) => date.getMonth() === currentDate.getMonth()

  const formatDateKey = (date: Date) => {
    // Use local date components to avoid timezone issues
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const formatTime = (time: string) => {
    const safe = time || '00:00'
    const [hours, minutes] = safe.split(':')
    const hour = parseInt(hours, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}.${minutes}${ampm}`
  }

  const goToPreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const handleDragOver = (e: React.DragEvent, dateKey: string) => {
    e.preventDefault()
    setDragOverDate(dateKey)
  }

  const handleDragLeave = () => {
    setDragOverDate(null)
  }

  const handleDrop = (e: React.DragEvent, dateKey: string) => {
    e.preventDefault()
    setDragOverDate(null)
    
    const templateData = e.dataTransfer.getData('application/json')
    if (templateData) {
      try {
        const template: ActivityTemplate & { _sourceDate?: string } = JSON.parse(templateData)
        
        // If activity was dragged from another day, remove from source first
        if (template._sourceDate && template._sourceDate !== dateKey) {
          onRemoveActivity(template._sourceDate, template.id)
        }
        
        // Don't re-add if dropped on the same day
        if (template._sourceDate === dateKey) {
          return
        }
        
        // Remove internal property before passing to parent
        const cleanTemplate = { ...template }
        delete cleanTemplate._sourceDate
        
        onDropActivity(dateKey, cleanTemplate)
      } catch (err) {
        console.error('Failed to parse dropped data:', err)
      }
    }
  }

  return (
    <div className="admin-calendar-container">
      <div className="admin-calendar-header">
        <button 
          className="calendar-nav-btn" 
          onClick={goToPreviousMonth}
          aria-label="Previous month"
        >
          ←
        </button>
        <div className="calendar-title-group">
          <h2 className="admin-calendar-title">
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button className="today-btn" onClick={goToToday}>
            Today
          </button>
        </div>
        <button 
          className="calendar-nav-btn" 
          onClick={goToNextMonth}
          aria-label="Next month"
        >
          →
        </button>
      </div>

      <div className="admin-calendar-weekdays">
        {WEEKDAYS.map(day => (
          <div key={day} className="admin-weekday-header">{day}</div>
        ))}
      </div>

      <div className="admin-calendar-grid">
        {calendarDays.map((date, index) => {
          const dateKey = formatDateKey(date)
          const dayActivities = scheduledActivities.get(dateKey) || []
          const isDragOver = dragOverDate === dateKey

          return (
            <div
              key={index}
              className={`admin-day-cell ${!isCurrentMonth(date) ? 'other-month' : ''} ${isToday(date) ? 'today' : ''} ${isDragOver ? 'drag-over' : ''}`}
              onDragOver={(e) => handleDragOver(e, dateKey)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, dateKey)}
            >
              <div className="admin-day-number">
                {date.getDate()}
              </div>
              <div className="admin-day-activities">
                {dayActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="admin-activity-card"
                    draggable
                    onDragStart={(e) => {
                      // Include original date key so we can remove from source
                      const dataWithSource = { ...activity, _sourceDate: dateKey }
                      e.dataTransfer.setData('application/json', JSON.stringify(dataWithSource))
                      e.dataTransfer.effectAllowed = 'move'
                    }}
                    onClick={() => onActivityClick?.(dateKey, activity)}
                  >
                    <div className="admin-activity-image">
                      <img 
                        src={activity.imageUrl || PLACEHOLDER_IMAGE} 
                        alt={activity.title}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE
                        }}
                      />
                    </div>
                    <div className="admin-activity-info">
                      <div className="admin-activity-title">{activity.title}</div>
                      <div className="admin-activity-time">
                        {formatTime(activity.startTime)} - {formatTime(activity.endTime)}
                      </div>
                    </div>
                    <button
                      className="admin-activity-remove"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRemoveActivity(dateKey, activity.id)
                      }}
                      aria-label="Remove activity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
