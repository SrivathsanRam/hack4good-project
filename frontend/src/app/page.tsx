import Link from 'next/link'

export default function Home() {
  return (
    <div className="container">
      <section className="hero reveal">
        <div>
          <span className="badge">Prototype: unified activities</span>
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
          <h3>Today's focus</h3>
          <p>
            Consolidate activity schedules, capture attendance details up front,
            and lower weekly admin time by half.
          </p>
          <div className="empty-state" style={{ marginTop: '18px' }}>
            <strong>No activities loaded yet</strong>
            <span>Connect the calendar feed to preview real sessions.</span>
          </div>
        </div>
      </section>

      <section className="section reveal delay-1">
        <div className="section-heading">
          <span className="section-eyebrow">At a glance</span>
          <h2 className="section-title">Prototype outcomes</h2>
          <p className="section-subtitle">
            The goal is a single scheduling surface that removes double booking
            and keeps every role aligned.
          </p>
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
            <span className="stat-value">4 hrs</span>
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
