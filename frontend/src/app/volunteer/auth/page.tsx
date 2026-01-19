'use client'

import AuthForm from '../../components/AuthForm'

export default function VolunteerAuthPage() {
  return (
    <AuthForm
      role="volunteer"
      roleName="Volunteer"
      dashboardPath="/volunteer/dashboard"
    />
  )
}
