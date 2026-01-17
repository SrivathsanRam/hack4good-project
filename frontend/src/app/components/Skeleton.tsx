'use client'

interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  borderRadius?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'card'
}

export function Skeleton({
  className = '',
  width,
  height,
  borderRadius,
  variant = 'rectangular',
}: SkeletonProps) {
  const variantStyles: Record<string, React.CSSProperties> = {
    text: {
      width: width || '100%',
      height: height || '1em',
      borderRadius: borderRadius || '4px',
    },
    circular: {
      width: width || '40px',
      height: height || '40px',
      borderRadius: '50%',
    },
    rectangular: {
      width: width || '100%',
      height: height || '100px',
      borderRadius: borderRadius || 'var(--radius-sm)',
    },
    card: {
      width: width || '100%',
      height: height || '200px',
      borderRadius: borderRadius || 'var(--radius-md)',
    },
  }

  return (
    <div
      className={`skeleton ${className}`}
      style={variantStyles[variant]}
      aria-hidden="true"
    />
  )
}

// Activity Card Skeleton
export function ActivityCardSkeleton() {
  return (
    <article className="activity-card skeleton-container" aria-hidden="true">
      <div className="activity-header">
        <div>
          <Skeleton variant="text" width="80px" height="24px" />
          <Skeleton variant="text" width="180px" height="20px" />
          <Skeleton variant="text" width="120px" height="16px" />
        </div>
        <div className="activity-side">
          <Skeleton variant="text" width="80px" height="28px" borderRadius="999px" />
        </div>
      </div>
      <div className="activity-tags">
        <Skeleton variant="text" width="70px" height="24px" borderRadius="999px" />
        <Skeleton variant="text" width="60px" height="24px" borderRadius="999px" />
      </div>
      <div className="activity-progress">
        <Skeleton variant="rectangular" height="8px" borderRadius="999px" />
        <Skeleton variant="text" width="120px" height="14px" />
      </div>
      <div className="activity-footer">
        <Skeleton variant="text" width="80px" height="16px" />
        <Skeleton variant="text" width="100px" height="36px" borderRadius="999px" />
      </div>
    </article>
  )
}

// Stats Card Skeleton
export function StatsCardSkeleton() {
  return (
    <div className="stat-card skeleton-container" aria-hidden="true">
      <Skeleton variant="text" width="60px" height="48px" />
      <Skeleton variant="text" width="100%" height="16px" />
      <Skeleton variant="text" width="80%" height="14px" />
    </div>
  )
}

// KPI Card Skeleton
export function KpiCardSkeleton() {
  return (
    <div className="kpi-card skeleton-container" aria-hidden="true">
      <Skeleton variant="text" width="100px" height="14px" />
      <Skeleton variant="text" width="80px" height="36px" />
      <Skeleton variant="text" width="120px" height="14px" />
    </div>
  )
}

// Hero Card Skeleton
export function HeroCardSkeleton() {
  return (
    <div className="hero-card skeleton-container" aria-hidden="true">
      <Skeleton variant="text" width="140px" height="24px" />
      <Skeleton variant="text" width="100%" height="16px" />
      <div className="stat-row">
        <Skeleton variant="rectangular" height="60px" borderRadius="var(--radius-sm)" />
        <Skeleton variant="rectangular" height="60px" borderRadius="var(--radius-sm)" />
      </div>
    </div>
  )
}

// Table Row Skeleton
export function TableRowSkeleton({ columns = 3 }: { columns?: number }) {
  return (
    <tr className="skeleton-container" aria-hidden="true">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i}>
          <Skeleton variant="text" width={i === 0 ? '120px' : '80px'} height="16px" />
        </td>
      ))}
    </tr>
  )
}

// Match Card Skeleton (for volunteer page)
export function MatchCardSkeleton() {
  return (
    <article className="match-card skeleton-container" aria-hidden="true">
      <div className="match-header">
        <Skeleton variant="text" width="60px" height="24px" borderRadius="999px" />
        <Skeleton variant="text" width="80px" height="28px" borderRadius="999px" />
      </div>
      <Skeleton variant="text" width="180px" height="20px" />
      <Skeleton variant="text" width="150px" height="16px" />
      <div className="match-reasons">
        <Skeleton variant="text" width="70px" height="22px" borderRadius="999px" />
      </div>
      <div className="activity-tags">
        <Skeleton variant="text" width="60px" height="22px" borderRadius="999px" />
        <Skeleton variant="text" width="50px" height="22px" borderRadius="999px" />
      </div>
      <div className="activity-footer">
        <Skeleton variant="text" width="100px" height="14px" />
        <Skeleton variant="text" width="100px" height="36px" borderRadius="999px" />
      </div>
    </article>
  )
}

// Day Panel Skeleton (for calendar)
export function DayPanelSkeleton() {
  return (
    <div className="day-panel skeleton-container" aria-hidden="true">
      <div className="day-title">
        <Skeleton variant="text" width="100px" height="18px" />
        <Skeleton variant="text" width="80px" height="24px" borderRadius="999px" />
      </div>
      <div className="day-cards">
        <ActivityCardSkeleton />
        <ActivityCardSkeleton />
      </div>
    </div>
  )
}
