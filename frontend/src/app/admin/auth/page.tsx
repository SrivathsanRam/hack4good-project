'use client'

import AuthForm from '../components/AuthForm'

export default function StaffAuthPage() {
  return (
    <AuthForm
      role="staff"
      roleName="Staff"
      dashboardPath="/admin/dashboard"
    />
  )
}
