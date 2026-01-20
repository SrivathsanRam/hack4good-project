'use client'

import { useEffect, useState } from 'react'

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

type Notification = {
  id: string
  title: string
  message: string
  type: 'reminder' | 'signup_request' | 'announcement'
  targetAudience: string
  activityId?: string
  createdAt: string
  isRead: boolean
}

interface NotificationBellProps {
  userEmail: string
  userId: string
  onActivityClick?: (activityId: string) => void
}

export default function NotificationBell({ userEmail, userId, onActivityClick }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch(`${apiBase}/api/notifications/user/${encodeURIComponent(userEmail)}`)
        if (response.ok) {
          const data = await response.json()
          setNotifications(data.data || [])
          setUnreadCount((data.data || []).filter((n: Notification) => !n.isRead).length)
        }
      } catch (err) {
        console.error('Failed to fetch notifications:', err)
      }
    }

    if (userEmail) {
      fetchNotifications()
      // Poll every 60 seconds
      const interval = setInterval(fetchNotifications, 60000)
      return () => clearInterval(interval)
    }
  }, [userEmail])

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`${apiBase}/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })
      
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      ))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id)
    }
    
    if (notification.activityId && onActivityClick) {
      onActivityClick(notification.activityId)
      setIsOpen(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'reminder': return '🔔'
      case 'signup_request': return '📝'
      case 'announcement': return '📢'
      default: return '📌'
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="notification-bell-container">
      <button 
        className="notification-bell-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>
      
      {isOpen && (
        <>
          <div className="notification-backdrop" onClick={() => setIsOpen(false)} />
          <div className="notification-dropdown">
            <div className="notification-header">
              <h3>Notifications</h3>
              {unreadCount > 0 && (
                <span className="notification-unread-count">{unreadCount} unread</span>
              )}
            </div>
            
            <div className="notification-list">
              {notifications.length === 0 ? (
                <div className="notification-empty">
                  No notifications yet
                </div>
              ) : (
                notifications.map(notification => (
                  <button
                    key={notification.id}
                    className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <span className="notification-icon">{getTypeIcon(notification.type)}</span>
                    <div className="notification-content">
                      <div className="notification-title">{notification.title}</div>
                      <div className="notification-message">{notification.message}</div>
                      <div className="notification-time">{formatTime(notification.createdAt)}</div>
                    </div>
                    {notification.activityId && (
                      <span className="notification-action">View →</span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
