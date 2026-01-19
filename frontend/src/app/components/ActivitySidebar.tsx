'use client'

import { ActivityTemplate } from './ActivityTemplateModal'

interface ActivitySidebarProps {
  templates: ActivityTemplate[]
  onCreateNew: () => void
  onEditTemplate: (template: ActivityTemplate) => void
  onDeleteTemplate: (id: string) => void
}

const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/60x40/e8f4ea/3d6d5a?text=Act'

export default function ActivitySidebar({
  templates,
  onCreateNew,
  onEditTemplate,
  onDeleteTemplate,
}: ActivitySidebarProps) {
  const handleDragStart = (e: React.DragEvent, template: ActivityTemplate) => {
    e.dataTransfer.setData('application/json', JSON.stringify(template))
    e.dataTransfer.effectAllowed = 'copy'
  }

  const formatTime = (time: string) => {
    const safe = time || '00:00'
    const [hours, minutes] = safe.split(':')
    const hour = parseInt(hours, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes}${ampm}`
  }

  return (
    <div className="activity-sidebar">
      <div className="sidebar-header">
        <h3>Activity Templates</h3>
        <button className="button primary small" onClick={onCreateNew}>
          + New
        </button>
      </div>

      <div className="sidebar-hint">
        Drag activities to calendar dates to schedule them
      </div>

      <div className="sidebar-templates">
        {templates.length === 0 ? (
          <div className="sidebar-empty">
            <p>No activity templates yet.</p>
            <p>Click "+ New" to create one!</p>
          </div>
        ) : (
          templates.map((template) => (
            <div
              key={template.id}
              className="sidebar-template"
              draggable
              onDragStart={(e) => handleDragStart(e, template)}
            >
              <div className="template-image">
                <img 
                  src={template.imageUrl || PLACEHOLDER_IMAGE} 
                  alt={template.title}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE
                  }}
                />
              </div>
              <div className="template-info">
                <div className="template-title">{template.title}</div>
                <div className="template-meta">
                  {formatTime(template.startTime)} - {formatTime(template.endTime)}
                </div>
                <div className="template-tags">
                  <span className="template-tag">{template.program}</span>
                  <span className="template-tag">{template.roles?.join(', ') || 'All'}</span>
                </div>
              </div>
              <div className="template-actions">
                <button
                  className="template-action-btn"
                  onClick={() => onEditTemplate(template)}
                  title="Edit"
                >
                  ✏️
                </button>
                <button
                  className="template-action-btn delete"
                  onClick={() => onDeleteTemplate(template.id)}
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
