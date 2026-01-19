'use client'

import { useState, useEffect, useRef } from 'react'
import LocationPicker from './LocationPicker'

export interface StaffUser {
  id: string
  name: string
  email: string
}

export interface ActivityTemplate {
  id: string
  title: string
  description: string
  startTime: string
  endTime: string
  location: string
  address: string
  coordinates: { lat: number; lng: number }
  program: string
  roles: string[] // ['Participant', 'Volunteer', 'Volunteers Only']
  type: string // renamed from cadence
  participantCapacity: number
  volunteerCapacity: number
  imageUrl: string
  wheelchairAccessible: boolean
  paymentRequired: boolean
  paymentAmount?: number
  staffPresent: string[] // Array of staff IDs
  contactIC: string // Single staff ID
}

interface ActivityTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (template: ActivityTemplate) => void
  editingTemplate?: ActivityTemplate | null
  staffUsers: StaffUser[]
}

const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/120x80/e8f4ea/3d6d5a?text=Activity'

// OpenAI API configuration for DALL-E image generation
const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY || ''

const programOptions = ['Movement', 'Creative', 'Caregiver sessions']
const roleOptions = ['Participant', 'Volunteer', 'Volunteers Only']
const typeOptions = ['Weekly', 'Fortnightly', 'Monthly', 'One-off']

const DEFAULT_COORDS = { lat: 1.3521, lng: 103.8198 }

export default function ActivityTemplateModal({
  isOpen,
  onClose,
  onSave,
  editingTemplate,
  staffUsers,
}: ActivityTemplateModalProps) {
  const [form, setForm] = useState<Omit<ActivityTemplate, 'id'>>({
    title: '',
    description: '',
    startTime: '14:30',
    endTime: '16:00',
    location: '',
    address: '',
    coordinates: DEFAULT_COORDS,
    program: 'Movement',
    roles: ['Participant'],
    type: 'Weekly',
    participantCapacity: 20,
    volunteerCapacity: 5,
    imageUrl: PLACEHOLDER_IMAGE,
    wheelchairAccessible: false,
    paymentRequired: false,
    paymentAmount: 0,
    staffPresent: [],
    contactIC: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [staffDropdownOpen, setStaffDropdownOpen] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [aiError, setAiError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const staffDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (editingTemplate) {
      setForm({
        title: editingTemplate.title,
        description: editingTemplate.description,
        startTime: editingTemplate.startTime,
        endTime: editingTemplate.endTime,
        location: editingTemplate.location,
        address: editingTemplate.address || '',
        coordinates: editingTemplate.coordinates || DEFAULT_COORDS,
        program: editingTemplate.program,
        roles: editingTemplate.roles || ['Participant'],
        type: editingTemplate.type || 'Weekly',
        participantCapacity: editingTemplate.participantCapacity || 0,
        volunteerCapacity: editingTemplate.volunteerCapacity || 0,
        imageUrl: editingTemplate.imageUrl,
        wheelchairAccessible: editingTemplate.wheelchairAccessible,
        paymentRequired: editingTemplate.paymentRequired,
        paymentAmount: editingTemplate.paymentAmount || 0,
        staffPresent: editingTemplate.staffPresent || [],
        contactIC: editingTemplate.contactIC || '',
      })
    } else {
      setForm({
        title: '',
        description: '',
        startTime: '14:30',
        endTime: '16:00',
        location: '',
        address: '',
        coordinates: DEFAULT_COORDS,
        program: 'Movement',
        roles: ['Participant'],
        type: 'Weekly',
        participantCapacity: 20,
        volunteerCapacity: 5,
        imageUrl: PLACEHOLDER_IMAGE,
        wheelchairAccessible: false,
        paymentRequired: false,
        paymentAmount: 0,
        staffPresent: [],
        contactIC: '',
      })
    }
    setErrors({})
  }, [editingTemplate, isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (staffDropdownRef.current && !staffDropdownRef.current.contains(e.target as Node)) {
        setStaffDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!form.title.trim()) newErrors.title = 'Title is required'
    if (!form.location.trim()) newErrors.location = 'Location is required'
    if (!form.startTime) newErrors.startTime = 'Start time is required'
    if (!form.endTime) newErrors.endTime = 'End time is required'
    if (form.roles.length === 0) newErrors.roles = 'At least one role is required'
    
    const hasParticipant = form.roles.includes('Participant')
    const hasVolunteer = form.roles.includes('Volunteer') || form.roles.includes('Volunteers Only')
    
    if (hasParticipant && form.participantCapacity < 1) {
      newErrors.participantCapacity = 'Participant capacity must be at least 1'
    }
    if (hasVolunteer && form.volunteerCapacity < 1) {
      newErrors.volunteerCapacity = 'Volunteer capacity must be at least 1'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const template: ActivityTemplate = {
      id: editingTemplate?.id || `template-${Date.now()}`,
      ...form,
    }
    onSave(template)
    onClose()
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, imageUrl: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const toggleRole = (role: string) => {
    setForm(prev => {
      const newRoles = prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
      return { ...prev, roles: newRoles }
    })
  }

  const toggleStaffPresent = (staffId: string) => {
    setForm(prev => {
      const newStaff = prev.staffPresent.includes(staffId)
        ? prev.staffPresent.filter(id => id !== staffId)
        : [...prev.staffPresent, staffId]
      return { ...prev, staffPresent: newStaff }
    })
  }

  const getStaffName = (id: string) => {
    return staffUsers.find(s => s.id === id)?.name || id
  }

  const generateAIImage = async () => {
    if (!aiPrompt.trim()) {
      setAiError('Please enter a prompt for image generation')
      return
    }

    if (!OPENAI_API_KEY) {
      setAiError('OpenAI API key not configured. Add NEXT_PUBLIC_OPENAI_API_KEY to your environment.')
      return
    }

    setIsGeneratingImage(true)
    setAiError('')

    try {
      // Use OpenAI DALL-E 3 for image generation
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: `A colorful, friendly illustration for a community activity: ${aiPrompt}. Style: cheerful, warm, inclusive, suitable for elderly care center activities. No text or words in the image. Cartoon or vector art style.`,
          n: 1,
          size: '1024x1024',
          quality: 'standard',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = errorData.error?.message || 'Failed to generate image'
        
        if (errorMessage.toLowerCase().includes('quota') || errorMessage.toLowerCase().includes('rate')) {
          throw new Error('API rate limit reached. Please wait a moment and try again.')
        }
        if (errorMessage.toLowerCase().includes('billing') || errorMessage.toLowerCase().includes('credit')) {
          throw new Error('OpenAI billing issue. Please check your API account.')
        }
        
        throw new Error(errorMessage)
      }

      const data = await response.json()
      
      if (data.data && data.data[0]?.url) {
        setForm(prev => ({ ...prev, imageUrl: data.data[0].url }))
        setAiPrompt('')
      } else {
        throw new Error('No image was generated. Try a different prompt.')
      }
    } catch (error) {
      console.error('AI Image generation error:', error)
      setAiError(error instanceof Error ? error.message : 'Failed to generate image. Please try again.')
    } finally {
      setIsGeneratingImage(false)
    }
  }

  const showParticipantCapacity = form.roles.includes('Participant')
  const showVolunteerCapacity = form.roles.includes('Volunteer') || form.roles.includes('Volunteers Only')

  if (!isOpen) return null

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content modal-xlarge" role="dialog" aria-modal="true">
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          ✕
        </button>

        <div className="modal-header">
          <h2 className="modal-title">
            {editingTemplate ? 'Edit Activity' : 'Create New Activity'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-grid">
            {/* Image Section */}
            <div className="form-section image-section">
              <label className="form-label">Activity Image</label>
              <div className="image-preview-container">
                <img 
                  src={form.imageUrl} 
                  alt="Activity preview" 
                  className="image-preview"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE
                  }}
                />
                <div className="image-actions">
                  <button
                    type="button"
                    className="button outline small"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    📁 Upload Image
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
              
              {/* AI Image Generation */}
              <div className="ai-image-section">
                <span className="form-label-small">Or generate with AI:</span>
                <div className="ai-prompt-container">
                  <input
                    type="text"
                    className="input ai-prompt-input"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Describe the image you want, e.g., 'seniors playing board games'"
                    disabled={isGeneratingImage}
                  />
                  <button
                    type="button"
                    className="button primary small ai-generate-btn"
                    onClick={generateAIImage}
                    disabled={isGeneratingImage || !aiPrompt.trim()}
                  >
                    {isGeneratingImage ? (
                      <>
                        <span className="spinner-small"></span>
                        Generating...
                      </>
                    ) : (
                      '✨ Generate'
                    )}
                  </button>
                </div>
                {aiError && <span className="form-error">{aiError}</span>}
                <span className="form-hint">
                  💡 Tip: Be descriptive! e.g., "elderly people doing tai chi in a garden"
                </span>
              </div>
            </div>

            {/* Basic Info */}
            <div className="form-section">
              <label className="form-label">
                Title <span className="required">*</span>
              </label>
              <input
                type="text"
                className={`input ${errors.title ? 'error' : ''}`}
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Table-top Games"
              />
              {errors.title && <span className="form-error">{errors.title}</span>}
            </div>

            <div className="form-section">
              <label className="form-label">Description</label>
              <textarea
                className="input textarea"
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the activity..."
                rows={3}
              />
            </div>

            <div className="form-row">
              <div className="form-section">
                <label className="form-label">
                  Start Time <span className="required">*</span>
                </label>
                <input
                  type="time"
                  className={`input ${errors.startTime ? 'error' : ''}`}
                  value={form.startTime}
                  onChange={(e) => setForm(prev => ({ ...prev, startTime: e.target.value }))}
                />
              </div>
              <div className="form-section">
                <label className="form-label">
                  End Time <span className="required">*</span>
                </label>
                <input
                  type="time"
                  className={`input ${errors.endTime ? 'error' : ''}`}
                  value={form.endTime}
                  onChange={(e) => setForm(prev => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
            </div>

            {/* Location Section */}
            <div className="form-section">
              <label className="form-label">
                Location Name <span className="required">*</span>
              </label>
              <input
                type="text"
                className={`input ${errors.location ? 'error' : ''}`}
                value={form.location}
                onChange={(e) => setForm(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., Activity Room A"
              />
              {errors.location && <span className="form-error">{errors.location}</span>}
            </div>

            <div className="form-section">
              <label className="form-label">
                Address (Search & Confirm on Map)
              </label>
              <LocationPicker
                address={form.address}
                coordinates={form.coordinates}
                onAddressChange={(addr) => setForm(prev => ({ ...prev, address: addr }))}
                onCoordinatesChange={(coords) => setForm(prev => ({ ...prev, coordinates: coords }))}
              />
            </div>

            <div className="form-row">
              <div className="form-section">
                <label className="form-label">Program</label>
                <select
                  className="input"
                  value={form.program}
                  onChange={(e) => setForm(prev => ({ ...prev, program: e.target.value }))}
                >
                  {programOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div className="form-section">
                <label className="form-label">Type</label>
                <select
                  className="input"
                  value={form.type}
                  onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value }))}
                >
                  {typeOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Roles Multi-Select */}
            <div className="form-section">
              <label className="form-label">
                Target Roles <span className="required">*</span>
              </label>
              <div className="multi-select-chips">
                {roleOptions.map(role => (
                  <button
                    key={role}
                    type="button"
                    className={`chip ${form.roles.includes(role) ? 'active' : ''}`}
                    onClick={() => toggleRole(role)}
                  >
                    {role}
                  </button>
                ))}
              </div>
              {errors.roles && <span className="form-error">{errors.roles}</span>}
              {form.roles.includes('Volunteers Only') && (
                <span className="form-hint">
                  ⚠️ "Volunteers Only" activities won't be shown to participants
                </span>
              )}
            </div>

            {/* Capacity Section */}
            <div className="form-row">
              {showParticipantCapacity && (
                <div className="form-section">
                  <label className="form-label">
                    Participant Vacancies <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    className={`input ${errors.participantCapacity ? 'error' : ''}`}
                    value={form.participantCapacity}
                    onChange={(e) => setForm(prev => ({ ...prev, participantCapacity: parseInt(e.target.value) || 0 }))}
                    min={0}
                  />
                  {errors.participantCapacity && <span className="form-error">{errors.participantCapacity}</span>}
                </div>
              )}
              {showVolunteerCapacity && (
                <div className="form-section">
                  <label className="form-label">
                    Volunteer Vacancies <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    className={`input ${errors.volunteerCapacity ? 'error' : ''}`}
                    value={form.volunteerCapacity}
                    onChange={(e) => setForm(prev => ({ ...prev, volunteerCapacity: parseInt(e.target.value) || 0 }))}
                    min={0}
                  />
                  {errors.volunteerCapacity && <span className="form-error">{errors.volunteerCapacity}</span>}
                </div>
              )}
            </div>

            {/* Staff Selection */}
            <div className="form-row">
              <div className="form-section" ref={staffDropdownRef}>
                <label className="form-label">Staff Present</label>
                <div className="multi-select-dropdown">
                  <button
                    type="button"
                    className="input multi-select-trigger"
                    onClick={() => setStaffDropdownOpen(!staffDropdownOpen)}
                  >
                    {form.staffPresent.length === 0
                      ? 'Select staff members...'
                      : `${form.staffPresent.length} selected`}
                    <span className="dropdown-arrow">▼</span>
                  </button>
                  {staffDropdownOpen && (
                    <div className="multi-select-menu">
                      {staffUsers.length === 0 ? (
                        <div className="multi-select-empty">No staff users found</div>
                      ) : (
                        staffUsers.map(staff => (
                          <label key={staff.id} className="multi-select-option">
                            <input
                              type="checkbox"
                              checked={form.staffPresent.includes(staff.id)}
                              onChange={() => toggleStaffPresent(staff.id)}
                            />
                            <span>{staff.name}</span>
                          </label>
                        ))
                      )}
                    </div>
                  )}
                </div>
                {form.staffPresent.length > 0 && (
                  <div className="selected-staff-list">
                    {form.staffPresent.map(id => (
                      <span key={id} className="selected-staff-chip">
                        {getStaffName(id)}
                        <button type="button" onClick={() => toggleStaffPresent(id)}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="form-section">
                <label className="form-label">Contact IC</label>
                <select
                  className="input"
                  value={form.contactIC}
                  onChange={(e) => setForm(prev => ({ ...prev, contactIC: e.target.value }))}
                >
                  <option value="">Select contact person...</option>
                  {staffUsers.map(staff => (
                    <option key={staff.id} value={staff.id}>{staff.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-section">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.wheelchairAccessible}
                  onChange={(e) => setForm(prev => ({ ...prev, wheelchairAccessible: e.target.checked }))}
                />
                <span>♿ Wheelchair Accessible</span>
              </label>
            </div>

            <div className="form-section">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.paymentRequired}
                  onChange={(e) => setForm(prev => ({ ...prev, paymentRequired: e.target.checked }))}
                />
                <span>💰 Payment Required</span>
              </label>
              {form.paymentRequired && (
                <div style={{ marginTop: '8px' }}>
                  <input
                    type="number"
                    className="input"
                    value={form.paymentAmount}
                    onChange={(e) => setForm(prev => ({ ...prev, paymentAmount: parseFloat(e.target.value) || 0 }))}
                    placeholder="Amount ($)"
                    min={0}
                    step={0.01}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="button outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="button primary">
              {editingTemplate ? 'Save Changes' : 'Create Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
