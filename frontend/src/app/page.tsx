'use client'

export default function Home() {
  return (
    <div className="container">
      <section className="hero">
        <div>
          <span className="badge">Prototype: unified activities</span>
          <h1>One calendar that respects every schedule.</h1>
          <p>
            Participants, volunteers, and staff all work from the same activity
            plan. No duplicate bookings. No manual follow-ups. Just a shared
            view that keeps everyone aligned.
          </p>
          <div className="hero-actions">
            <a className="button primary" href="/calendar">
              Open the calendar
            </a>
            <a className="button" href="/admin">
              Staff console
            </a>
          </div>
        </div>
        <div className="hero-card">
          <h3>Today’s focus</h3>
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

      <section className="grid">
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
      </section>
    </div>
  )
}
