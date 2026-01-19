'use client'

import AuthForm from '../components/AuthForm'

export default function ParticipantAuthPage() {
  return (
    <AuthForm
      role="participant"
      roleName="Participant"
      dashboardPath="/participant/dashboard"
    />
  )
}
