'use client'

import { useMemo, useState } from 'react'
import DayCell from './DayCell'
import ActivityCard, { Activity } from './ActivityCard'

interface CalendarGridProps {
  activities: Activity[]
  filteredActivities: Activity[]
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function CalendarGrid({ activities, filteredActivities }: CalendarGridProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const filteredActivityIds = useMemo(() => {
    return new Set(filteredActivities.map(a => a.id))
  }, [filteredActivities])

  // Get calendar days for the current month view
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    // First day of the month
    const firstDay = new Date(year, month, 1)
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0)

    // Start from the Sunday before (or on) the first day
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - startDate.getDay())

    // End on the Saturday after (or on) the last day
    const endDate = new Date(lastDay)
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()))

    const days: Date[] = []
    const current = new Date(startDate)

    while (current <= endDate) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    return days
  }, [currentDate])

  // Group activities by date
  const activitiesByDate = useMemo(() => {
    const map = new Map<string, Activity[]>()
    for (const activity of activities) {
      const dateKey = activity.date
      const existing = map.get(dateKey) || []
      existing.push(activity)
      map.set(dateKey, existing)
    }
    return map
  }, [activities])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString()
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth()
  }

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const goToPreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(null)
  }

  const handleDayClick = (date: Date) => {
    setSelectedDate(date)
  }

  const selectedDateActivities = useMemo(() => {
    if (!selectedDate) return []
    const dateKey = formatDateKey(selectedDate)
    return activitiesByDate.get(dateKey) || []
  }, [selectedDate, activitiesByDate])

  const formatSelectedDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <button 
          className="calendar-nav-btn" 
          onClick={goToPreviousMonth}
          aria-label="Previous month"
        >
          ←
        </button>
        <div className="calendar-title-group">
          <h2 className="calendar-title">
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

      <div className="calendar-weekdays">
        {WEEKDAYS.map(day => (
          <div key={day} className="weekday-header">{day}</div>
        ))}
      </div>

      <div className="calendar-grid">
        {calendarDays.map((date, index) => {
          const dateKey = formatDateKey(date)
          const dayActivities = activitiesByDate.get(dateKey) || []

          return (
            <DayCell
              key={index}
              date={date}
              activities={dayActivities}
              filteredActivityIds={filteredActivityIds}
              isCurrentMonth={isCurrentMonth(date)}
              isToday={isToday(date)}
              onDayClick={handleDayClick}
            />
          )
        })}
      </div>

      {/* Selected Day Detail Panel */}
      {selectedDate && (
        <div className="selected-day-panel">
          <div className="selected-day-header">
            <h3>{formatSelectedDate(selectedDate)}</h3>
            <button 
              className="close-panel-btn" 
              onClick={() => setSelectedDate(null)}
              aria-label="Close panel"
            >
              ✕
            </button>
          </div>
          {selectedDateActivities.length === 0 ? (
            <p className="no-activities">No activities scheduled for this day.</p>
          ) : (
            <div className="selected-day-activities">
              {selectedDateActivities.map(activity => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  isFiltered={!filteredActivityIds.has(activity.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="calendar-legend">
        <div className="legend-item">
          <span className="legend-dot active"></span>
          <span>Matches filters</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot filtered"></span>
          <span>Filtered out</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot today"></span>
          <span>Today</span>
        </div>
      </div>
    </div>
  )
}
