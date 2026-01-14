import Link from 'next/link'

export default function CalendarPage() {
  return (
    <div className="container">
      <section className="hero section-tight reveal">
        <div>
          <span className="badge">Calendar view</span>
          <h1>Unified activity schedule</h1>
          <p>
            Filter by program, role, or cadence to see the sessions that matter
            most.
          </p>
        </div>
        <div className="hero-card">
          <h3>Quick actions</h3>
          <p>Manage schedule visibility and registrations.</p>
          <div className="hero-actions">
            <Link className="button" href="/admin">
              Add activity
            </Link>
            <Link className="button primary" href="/volunteer">
              Volunteer view
            </Link>
          </div>
        </div>
      </section>

      <section className="reveal delay-1">
        <div className="filters">
          <span className="chip active">All programs</span>
          <span className="chip">Movement</span>
          <span className="chip">Creative</span>
          <span className="chip">Caregiver sessions</span>
          <span className="chip">Participants</span>
          <span className="chip">Volunteers</span>
        </div>
        <div className="empty-state">
          <strong>No activities scheduled</strong>
          <span>Load sample data to preview the month view.</span>
        </div>
      </section>
    </div>
  )
}
