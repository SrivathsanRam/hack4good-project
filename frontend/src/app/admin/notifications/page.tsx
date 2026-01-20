'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

type Activity = {
  id: string
  title: string
  date: string
}

type Notification = {
  id: string
  title: string
  message: string
  type: 'reminder' | 'signup_request' | 'announcement'
  targetAudience: 'all' | 'participants' | 'volunteers' | 'experienced_volunteers'
  activityId?: string
  createdBy: string
  createdAt: string
  expiresAt?: string
  read: string[]
}

type ExperiencedVolunteer = {
  id: string
  name: string
  email: string
  completedActivities: number
}

export default function NotificationsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [experiencedVolunteers, setExperiencedVolunteers] = useState<ExperiencedVolunteer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  // Form state
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState<'reminder' | 'signup_request' | 'announcement'>('announcement')
  const [targetAudience, setTargetAudience] = useState<'all' | 'participants' | 'volunteers' | 'experienced_volunteers'>('all')
  const [activityId, setActivityId] = useState('')
  const [expiresAt, setExpiresAt] = useState('')

  // Redirect if not staff
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/admin/auth')
      } else if (user.role !== 'staff') {
        router.push('/')
      }
    }
  }, [user, authLoading, router])

  // Fetch data
  useEffect(() => {
    if (!user || user.role !== 'staff') return

    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [notificationsRes, activitiesRes, volunteersRes] = await Promise.all([
          fetch(`${apiBase}/api/notifications`),
          fetch(`${apiBase}/api/activities`),
          fetch(`${apiBase}/api/volunteers/experienced`)
        ])

        if (notificationsRes.ok) {
          const data = await notificationsRes.json()
          setNotifications(data.data || [])
        }
        
        if (activitiesRes.ok) {
          const data = await activitiesRes.json()
          setActivities(data.data || [])
        }
        
        if (volunteersRes.ok) {
          const data = await volunteersRes.json()
          setExperiencedVolunteers(data.data || [])
        }
      } catch (err) {
        console.error('Failed to fetch data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    
    setSubmitting(true)
    try {
      const response = await fetch(`${apiBase}/api/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          message,
          type,
          targetAudience,
          activityId: activityId || null,
          createdBy: user.id,
          expiresAt: expiresAt || null
        })
      })
      
      if (!response.ok) throw new Error('Failed to create notification')
      
      const data = await response.json()
      setNotifications(prev => [data.data, ...prev])
      
      // Reset form
      setTitle('')
      setMessage('')
      setType('announcement')
      setTargetAudience('all')
      setActivityId('')
      setExpiresAt('')
      setShowForm(false)
    } catch (err) {
      console.error('Error creating notification:', err)
      alert('Failed to create notification')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification?')) return
    
    try {
      const response = await fetch(`${apiBase}/api/notifications/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete notification')
      
      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch (err) {
      console.error('Error deleting notification:', err)
      alert('Failed to delete notification')
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getAudienceLabel = (audience: string) => {
    switch (audience) {
      case 'all': return '👥 Everyone'
      case 'participants': return '🧑 Participants'
      case 'volunteers': return '🙌 All Volunteers'
      case 'experienced_volunteers': return '⭐ Experienced Volunteers'
      default: return audience
    }
  }

  const getTypeLabel = (t: string) => {
    switch (t) {
      case 'reminder': return '🔔 Reminder'
      case 'signup_request': return '📝 Signup Request'
      case 'announcement': return '📢 Announcement'
      default: return t
    }
  }

  if (authLoading || !user) {
    return (
      <main className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div>Loading...</div>
      </main>
    )
  }

  return (
    <main className="page">
      <section className="container" style={{ padding: '32px 24px' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', marginBottom: '8px' }}>
              Notifications Manager 📣
            </h1>
            <p style={{ color: 'var(--muted)' }}>
              Send reminders and announcements to volunteers and participants
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setShowForm(!showForm)}
              className="button primary"
            >
              {showForm ? 'Cancel' : '+ Create Notification'}
            </button>
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="button outline"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Experienced Volunteers Info */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '16px 20px',
          marginBottom: '24px'
        }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '8px', color: '#4338ca' }}>
            ⭐ Experienced Volunteers ({experiencedVolunteers.length})
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '8px' }}>
            Volunteers with 5+ completed activities can be targeted specifically.
          </p>
          {experiencedVolunteers.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {experiencedVolunteers.slice(0, 5).map(v => (
                <span key={v.id} style={{
                  padding: '4px 10px',
                  background: 'white',
                  borderRadius: '999px',
                  fontSize: '0.8rem',
                  color: '#4338ca'
                }}>
                  {v.name} ({v.completedActivities} activities)
                </span>
              ))}
              {experiencedVolunteers.length > 5 && (
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)', padding: '4px' }}>
                  +{experiencedVolunteers.length - 5} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Create Notification Form */}
        {showForm && (
          <div style={{
            background: 'var(--card)',
            borderRadius: 'var(--radius-md)',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '20px' }}>Create New Notification</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                    Title *
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Reminder: Movement Session Tomorrow"
                    required
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                    Message *
                  </label>
                  <textarea
                    className="input"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write your notification message here..."
                    rows={4}
                    required
                    style={{ resize: 'vertical' }}
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                      Type *
                    </label>
                    <select
                      className="input"
                      value={type}
                      onChange={(e) => setType(e.target.value as any)}
                      required
                    >
                      <option value="announcement">📢 Announcement</option>
                      <option value="reminder">🔔 Reminder</option>
                      <option value="signup_request">📝 Signup Request</option>
                    </select>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                      Target Audience *
                    </label>
                    <select
                      className="input"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value as any)}
                      required
                    >
                      <option value="all">👥 Everyone</option>
                      <option value="participants">🧑 Participants Only</option>
                      <option value="volunteers">🙌 All Volunteers</option>
                      <option value="experienced_volunteers">⭐ Experienced Volunteers Only</option>
                    </select>
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                      Link to Activity (optional)
                    </label>
                    <select
                      className="input"
                      value={activityId}
                      onChange={(e) => setActivityId(e.target.value)}
                    >
                      <option value="">-- No linked activity --</option>
                      {activities.slice(0, 20).map(a => (
                        <option key={a.id} value={a.id}>
                          {a.title} ({new Date(a.date).toLocaleDateString()})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                      Expires At (optional)
                    </label>
                    <input
                      type="datetime-local"
                      className="input"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '4px' }}>
                      Must be a future date. Leave empty for no expiration.
                    </p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button
                    type="submit"
                    className="button primary"
                    disabled={submitting}
                  >
                    {submitting ? 'Sending...' : 'Send Notification'}
                  </button>
                  <button
                    type="button"
                    className="button outline"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Notifications List */}
        <h2 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>
          Recent Notifications ({notifications.length})
        </h2>
        
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: 'var(--muted)',
            background: 'var(--card)',
            borderRadius: 'var(--radius-md)'
          }}>
            No notifications sent yet. Create your first notification above!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {notifications.map(notification => (
              <div
                key={notification.id}
                style={{
                  background: 'var(--card)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px 20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  gap: '12px',
                  marginBottom: '8px'
                }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      padding: '4px 10px',
                      background: 'var(--accent-soft)',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}>
                      {getTypeLabel(notification.type)}
                    </span>
                    <span style={{
                      padding: '4px 10px',
                      background: notification.targetAudience === 'experienced_volunteers' 
                        ? 'rgba(99, 102, 241, 0.15)' 
                        : 'var(--line)',
                      color: notification.targetAudience === 'experienced_volunteers' 
                        ? '#4338ca' 
                        : 'inherit',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 500
                    }}>
                      {getAudienceLabel(notification.targetAudience)}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(notification.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--muted)',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      fontSize: '0.85rem'
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
                
                <h3 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>
                  {notification.title}
                </h3>
                <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '12px' }}>
                  {notification.message}
                </p>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  fontSize: '0.8rem',
                  color: 'var(--muted)'
                }}>
                  <span>
                    Sent: {formatDate(notification.createdAt)}
                    {notification.expiresAt && ` • Expires: ${formatDate(notification.expiresAt)}`}
                  </span>
                  <span>
                    👁️ Read by {notification.read.length} users
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
