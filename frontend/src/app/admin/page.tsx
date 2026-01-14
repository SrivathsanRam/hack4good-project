export default function AdminPage() {
  return (
    <div className="container">
      <section className="hero section-tight reveal">
        <div>
          <span className="badge">Staff console</span>
          <h1>Plan schedules and confirm attendance</h1>
          <p>
            Draft weekly activities, capture nuanced registration details, and
            export attendance in minutes.
          </p>
        </div>
        <div className="hero-card">
          <h3>Next steps</h3>
          <p>
            Activity creation and attendance tracking will live here once data
            integration begins.
          </p>
        </div>
      </section>

      <section className="grid reveal delay-1">
        <article className="card">
          <h4>Schedule builder</h4>
          <p>Create sessions with capacity, location, and program notes.</p>
        </article>
        <article className="card">
          <h4>Registrations</h4>
          <p>See participant and volunteer confirmations in one list.</p>
        </article>
        <article className="card">
          <h4>Attendance export</h4>
          <p>Download CSVs for reporting or caregiver follow-up.</p>
        </article>
      </section>
    </div>
  )
}
