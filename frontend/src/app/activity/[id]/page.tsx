import Link from 'next/link'

export default function ActivityDetailPage() {
  return (
    <div className="container">
      <section className="hero section-tight reveal">
        <div>
          <span className="badge">Activity details</span>
          <h1>Session details coming next</h1>
          <p>
            This page will hold the registration form, accessibility notes, and
            attendance status in the next milestone.
          </p>
        </div>
        <div className="hero-card">
          <h3>Quick links</h3>
          <p>Return to the unified calendar to pick another session.</p>
          <div className="hero-actions">
            <Link className="button primary" href="/calendar">
              Back to calendar
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
