'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import ActivityTemplateModal, { ActivityTemplate, StaffUser } from '../../components/ActivityTemplateModal'
import ActivitySidebar from '../../components/ActivitySidebar'
import AdminCalendarGrid from '../../components/AdminCalendarGrid'
import { Activity } from '../../components/ActivityCard'

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function AdminCalendarPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  
  const [templates, setTemplates] = useState<ActivityTemplate[]>([])
  const [scheduledActivities, setScheduledActivities] = useState<Map<string, ActivityTemplate[]>>(new Map())
  const [existingActivities, setExistingActivities] = useState<Activity[]>([])
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([])
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ActivityTemplate | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Redirect if not logged in or not staff
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/admin/auth')
      } else if (user.role !== 'staff') {
        router.push('/')
      }
    }
  }, [user, authLoading, router])

  // Fetch existing activities and staff users from database
  useEffect(() => {
    if (!user || user.role !== 'staff') return

    const fetchData = async () => {
      try {
        // Fetch staff users
        const staffResponse = await fetch(`${apiBase}/api/users/staff`)
        if (staffResponse.ok) {
          const staffData = await staffResponse.json()
          setStaffUsers(staffData.data || [])
        }

        // Fetch activities
        const response = await fetch(`${apiBase}/api/activities`)
        if (response.ok) {
          const data = await response.json()
          const activities = data.data || []
          setExistingActivities(activities)
          
          // Convert existing activities to scheduled format
          const scheduled = new Map<string, ActivityTemplate[]>()
          for (const activity of activities) {
            const dateKey = activity.date
            const template: ActivityTemplate = {
              id: activity.id,
              title: activity.title,
              description: activity.description || '',
              startTime: activity.startTime,
              endTime: activity.endTime,
              location: activity.location,
              address: activity.address || '',
              coordinates: activity.coordinates || { lat: 1.3521, lng: 103.8198 },
              program: activity.program,
              roles: activity.roles || [activity.role || 'Participant'],
              type: activity.type || activity.cadence || 'Weekly',
              participantCapacity: activity.participantCapacity || activity.capacity || 0,
              volunteerCapacity: activity.volunteerCapacity || 0,
              imageUrl: activity.imageUrl || 'https://via.placeholder.com/120x80/e8f4ea/3d6d5a?text=Activity',
              wheelchairAccessible: activity.wheelchairAccessible || false,
              paymentRequired: activity.paymentRequired || false,
              paymentAmount: activity.paymentAmount,
              staffPresent: activity.staffPresent || [],
              contactIC: activity.contactIC || '',
            }
            const existing = scheduled.get(dateKey) || []
            existing.push(template)
            scheduled.set(dateKey, existing)
          }
          setScheduledActivities(scheduled)
        }
      } catch (err) {
        console.error('Failed to fetch data:', err)
      }
    }

    // Load templates from localStorage
    const savedTemplates = localStorage.getItem('activityTemplates')
    if (savedTemplates) {
      try {
        setTemplates(JSON.parse(savedTemplates))
      } catch (e) {
        console.error('Failed to parse saved templates:', e)
      }
    }

    fetchData()
  }, [user])

  // Save templates to localStorage whenever they change
  useEffect(() => {
    if (templates.length > 0) {
      localStorage.setItem('activityTemplates', JSON.stringify(templates))
    }
  }, [templates])

  const handleCreateTemplate = () => {
    setEditingTemplate(null)
    setIsModalOpen(true)
  }

  const handleEditTemplate = (template: ActivityTemplate) => {
    setEditingTemplate(template)
    setIsModalOpen(true)
  }

  const handleSaveTemplate = (template: ActivityTemplate) => {
    setTemplates(prev => {
      const existing = prev.findIndex(t => t.id === template.id)
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing] = template
        return updated
      }
      return [...prev, template]
    })
  }

  const handleDeleteTemplate = (id: string) => {
    if (confirm('Delete this activity template?')) {
      setTemplates(prev => prev.filter(t => t.id !== id))
    }
  }

  const handleDropActivity = useCallback((dateKey: string, template: ActivityTemplate) => {
    setScheduledActivities(prev => {
      const next = new Map(prev)
      const existing = next.get(dateKey) || []
      // Create a new instance with unique ID for this scheduled occurrence
      const newActivity: ActivityTemplate = {
        ...template,
        id: `scheduled-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      }
      next.set(dateKey, [...existing, newActivity])
      return next
    })
    setHasUnsavedChanges(true)
    setSaveMessage(null)
  }, [])

  const handleRemoveActivity = useCallback((dateKey: string, activityId: string) => {
    setScheduledActivities(prev => {
      const next = new Map(prev)
      const existing = next.get(dateKey) || []
      next.set(dateKey, existing.filter(a => a.id !== activityId))
      if (next.get(dateKey)?.length === 0) {
        next.delete(dateKey)
      }
      return next
    })
    setHasUnsavedChanges(true)
    setSaveMessage(null)
  }, [])

  const handleActivityClick = (_dateKey: string, template: ActivityTemplate) => {
    setEditingTemplate(template)
    setIsModalOpen(true)
  }

  const handleSaveCalendar = async () => {
    setIsSaving(true)
    setSaveMessage(null)

    try {
      // First, delete all existing activities
      for (const activity of existingActivities) {
        await fetch(`${apiBase}/api/activities/${activity.id}`, {
          method: 'DELETE',
        })
      }

      // Then create all scheduled activities
      const newActivities: Activity[] = []
      for (const [dateKey, activities] of scheduledActivities) {
        for (const template of activities) {
          const activityData = {
            title: template.title,
            description: template.description,
            date: dateKey,
            startTime: template.startTime,
            endTime: template.endTime,
            location: template.location,
            address: template.address,
            coordinates: template.coordinates,
            program: template.program,
            roles: template.roles,
            type: template.type,
            participantCapacity: template.participantCapacity,
            volunteerCapacity: template.volunteerCapacity,
            participantSeatsLeft: template.participantCapacity,
            volunteerSeatsLeft: template.volunteerCapacity,
            imageUrl: template.imageUrl,
            wheelchairAccessible: template.wheelchairAccessible,
            paymentRequired: template.paymentRequired,
            paymentAmount: template.paymentAmount,
            staffPresent: template.staffPresent,
            contactIC: template.contactIC,
          }

          const response = await fetch(`${apiBase}/api/activities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(activityData),
          })

          if (response.ok) {
            const result = await response.json()
            newActivities.push(result.data)
          }
        }
      }

      setExistingActivities(newActivities)
      setHasUnsavedChanges(false)
      setSaveMessage({ type: 'success', text: 'Calendar saved successfully! Changes are now visible to users.' })
    } catch (err) {
      console.error('Failed to save calendar:', err)
      setSaveMessage({ type: 'error', text: 'Failed to save calendar. Please try again.' })
    } finally {
      setIsSaving(false)
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
      <div className="admin-calendar-page">
        <div className="admin-calendar-topbar">
          <div className="topbar-left">
            <h1>📅 Calendar Manager</h1>
            <p className="topbar-subtitle">Create activities and drag them to dates to schedule</p>
          </div>
          <div className="topbar-actions">
            {hasUnsavedChanges && (
              <span className="unsaved-badge">Unsaved changes</span>
            )}
            <button
              className="button primary"
              onClick={handleSaveCalendar}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : '💾 Save Calendar'}
            </button>
          </div>
        </div>

        {saveMessage && (
          <div className={`save-message ${saveMessage.type}`}>
            {saveMessage.text}
          </div>
        )}

        <div className="admin-calendar-layout">
          <ActivitySidebar
            templates={templates}
            onCreateNew={handleCreateTemplate}
            onEditTemplate={handleEditTemplate}
            onDeleteTemplate={handleDeleteTemplate}
          />
          
          <AdminCalendarGrid
            activities={existingActivities}
            scheduledActivities={scheduledActivities}
            onDropActivity={handleDropActivity}
            onRemoveActivity={handleRemoveActivity}
            onActivityClick={handleActivityClick}
          />
        </div>
      </div>

      <ActivityTemplateModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingTemplate(null)
        }}
        onSave={handleSaveTemplate}
        editingTemplate={editingTemplate}
        staffUsers={staffUsers}
      />
    </main>
  )
}
