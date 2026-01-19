'use client'

import ActivityCard, { Activity } from './ActivityCard'

interface DayCellProps {
  date: Date
  activities: Activity[]
  filteredActivityIds: Set<string> // Activities that match filters
  isCurrentMonth: boolean
  isToday: boolean
  onDayClick?: (date: Date) => void
}

export default function DayCell({
  date,
  activities,
  filteredActivityIds,
  isCurrentMonth,
  isToday,
  onDayClick,
}: DayCellProps) {
  const dayNumber = date.getDate()
  const hasActivities = activities.length > 0
  const matchedCount = activities.filter(a => filteredActivityIds.has(a.id)).length
  const allFiltered = hasActivities && matchedCount === 0

  return (
    <div
      className={`calendar-day-cell ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${hasActivities ? 'has-activities' : ''} ${allFiltered ? 'all-filtered' : ''}`}
      onClick={() => onDayClick?.(date)}
    >
      <div className="day-header">
        <span className={`day-number ${isToday ? 'today-badge' : ''}`}>
          {dayNumber}
        </span>
        {hasActivities && (
          <span className="activity-count">
            {matchedCount > 0 ? `${matchedCount}/${activities.length}` : activities.length}
          </span>
        )}
      </div>
      <div className="day-activities">
        {activities.slice(0, 4).map((activity) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            isFiltered={!filteredActivityIds.has(activity.id)}
            compact
          />
        ))}
        {activities.length > 4 && (
          <span className="more-activities">+{activities.length - 4} more</span>
        )}
      </div>
    </div>
  )
}
