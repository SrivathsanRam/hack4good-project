'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

type FeaturedActivity = {
  id: string
  title: string
  date: string
  startTime: string
  endTime: string
  location: string
  program: string
  description: string
  imageUrl?: string
  participantCapacity?: number
  volunteerCapacity?: number
  participantSeatsLeft?: number
  volunteerSeatsLeft?: number
}

const formatDate = (isoDate: string) => {
  const date = new Date(`${isoDate}T00:00:00`)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

export default function Home() {
  const [featuredActivity, setFeaturedActivity] = useState<FeaturedActivity | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await fetch(`${apiBase}/api/activities/featured/current`)
        if (res.ok) {
          const data = await res.json()
          setFeaturedActivity(data.data || null)
        }
      } catch (err) {
        console.error('Failed to fetch featured activity:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchFeatured()
  }, [])

  const getCapacity = (a: FeaturedActivity) => {
    return (a.participantCapacity ?? 0) + (a.volunteerCapacity ?? 0)
  }

  const getSeatsLeft = (a: FeaturedActivity) => {
    return (a.participantSeatsLeft ?? 0) + (a.volunteerSeatsLeft ?? 0)
  }

  return (
    <div className="container">
      <section className="hero reveal">
        <div>
          <h1>One calendar that respects every schedule.</h1>
          <p>
            Participants, volunteers, and staff all work from the same activity
            plan. No duplicate bookings. No manual follow-ups. Just a shared
            view that keeps everyone aligned.
          </p>
          <div className="hero-actions">
            <Link className="button primary" href="/calendar">
              Open the calendar
            </Link>
            <Link className="button" href="/admin">
              Staff console
            </Link>
          </div>
        </div>
        <div className="hero-card">
          <h3>Featured Activity ⭐</h3>
          {isLoading ? (
            <div style={{ padding: '20px 0', color: 'var(--muted)' }}>
              Loading...
            </div>
          ) : featuredActivity ? (
            <div style={{ marginTop: '12px' }}>
              {featuredActivity.imageUrl && (
                <div style={{ 
                  borderRadius: '8px', 
                  overflow: 'hidden', 
                  marginBottom: '12px',
                  maxHeight: '150px'
                }}>
                  <img 
                    src={featuredActivity.imageUrl} 
                    alt={featuredActivity.title}
                    style={{ 
                      width: '100%', 
                      height: '150px', 
                      objectFit: 'cover' 
                    }}
                  />
                </div>
              )}
              <h4 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>
                {featuredActivity.title}
              </h4>
              <p style={{ 
                color: 'var(--muted)', 
                fontSize: '0.9rem', 
                marginBottom: '8px' 
              }}>
                {formatDate(featuredActivity.date)} • {featuredActivity.startTime} - {featuredActivity.endTime}
              </p>
              <p style={{ 
                color: 'var(--muted)', 
                fontSize: '0.85rem', 
                marginBottom: '8px' 
              }}>
                📍 {featuredActivity.location}
              </p>
              {featuredActivity.description && (
                <p style={{ 
                  fontSize: '0.9rem', 
                  marginBottom: '12px',
                  lineHeight: 1.5 
                }}>
                  {featuredActivity.description.length > 120 
                    ? featuredActivity.description.slice(0, 120) + '...' 
                    : featuredActivity.description}
                </p>
              )}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginTop: '12px'
              }}>
                <span style={{ 
                  fontSize: '0.85rem', 
                  color: 'var(--muted)' 
                }}>
                  {getSeatsLeft(featuredActivity)}/{getCapacity(featuredActivity)} spots left
                </span>
                <Link 
                  href={`/activity/${featuredActivity.id}`}
                  className="button primary"
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  View Details
                </Link>
              </div>
            </div>
          ) : (
            <div className="empty-state" style={{ marginTop: '18px' }}>
              <strong>No featured activity</strong>
              <span>Staff can feature an activity from the dashboard.</span>
            </div>
          )}
        </div>
      </section>

      <section className="section reveal delay-1">
        <div className="section-heading">
          <span className="section-eyebrow">At a glance</span>
          <h2 className="section-title">Outcomes</h2>

        </div>
        <div className="stat-grid">
          <div className="stat-card">
            <span className="stat-value">1</span>
            <span className="stat-label">Shared calendar for all programs</span>
            <span className="stat-foot">Participants stay in sync.</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">3</span>
            <span className="stat-label">Roles supported in one workflow</span>
            <span className="stat-foot">Participants, volunteers, staff.</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">6</span>
            <span className="stat-label">Sample sessions already mapped</span>
            <span className="stat-foot">Ready for live data.</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">2 hrs</span>
            <span className="stat-label">Target weekly admin time</span>
            <span className="stat-foot">Down from 8+ hours today.</span>
          </div>
        </div>
      </section>

      <section className="section reveal delay-2">
        <div className="section-heading">
          <span className="section-eyebrow">How it works</span>
          <h2 className="section-title">A simple shared flow</h2>
          <p className="section-subtitle">
            Staff publishes once, participants self-register, and attendance
            stays consolidated.
          </p>
        </div>
        <div className="flow-grid">
          <div className="flow-card">
            <span className="flow-step">01</span>
            <h3>Publish the week</h3>
            <p>Staff set sessions, capacity, and accessibility notes.</p>
          </div>
          <div className="flow-card">
            <span className="flow-step">02</span>
            <h3>Self-register</h3>
            <p>Participants and volunteers pick sessions in one view.</p>
          </div>
          <div className="flow-card">
            <span className="flow-step">03</span>
            <h3>Track attendance</h3>
            <p>Shared lists remove duplicate forms and follow-ups.</p>
          </div>
        </div>
      </section>

      <section className="section reveal delay-2">
        <div className="section-heading">
          <span className="section-eyebrow">Experience</span>
          <h2 className="section-title">Designed for every role</h2>
          <p className="section-subtitle">
            Each user sees the same schedule with only the actions they need.
          </p>
        </div>
        <div className="grid">
          <article className="card">
            <h4>Participants</h4>
            <p>Register across programs from a single calendar view.</p>
          </article>
          <article className="card">
            <h4>Volunteers</h4>
            <p>Browse opportunities, confirm shifts, and track commitments.</p>
          </article>
          <article className="card">
            <h4>Staff</h4>
            <p>Schedule once, share everywhere, and export attendance fast.</p>
          </article>
        </div>
      </section>

      <section className="callout reveal delay-2">
        <h2>Ready to turn the calendar into the single source of truth?</h2>
        <p>
          Explore the unified schedule or jump straight to the staff console to
          build the next month.
        </p>
        <div className="callout-actions">
          <Link className="button primary" href="/calendar">
            Explore the calendar
          </Link>
          <Link className="button ghost" href="/admin">
            Open staff console
          </Link>
        </div>
      </section>
    </div>
  )
}
