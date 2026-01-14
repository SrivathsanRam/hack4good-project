export default function VolunteerPage() {
  return (
    <div className="container">
      <section className="hero section-tight reveal">
        <div>
          <span className="badge">Volunteer view</span>
          <h1>Discover ways to support each session</h1>
          <p>
            Opportunities will appear here with time, location, and role notes
            once the schedule is connected.
          </p>
        </div>
        <div className="hero-card">
          <h3>Volunteer readiness</h3>
          <p>
            Track onboarding steps, confirm availability, and join the calendar
            once activity data arrives.
          </p>
        </div>
      </section>

      <section className="grid reveal delay-1">
        <article className="card">
          <h4>Skills spotlight</h4>
          <p>Highlight specialized support like accessibility or tech help.</p>
        </article>
        <article className="card">
          <h4>Availability</h4>
          <p>Set weekly cadence to receive matched opportunities.</p>
        </article>
        <article className="card">
          <h4>Commitments</h4>
          <p>Confirm or release shifts without email follow-up.</p>
        </article>
      </section>
    </div>
  )
}
