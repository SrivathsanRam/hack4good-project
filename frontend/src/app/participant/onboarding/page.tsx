'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import LocationPicker from '../../components/LocationPicker'

const membershipOptions = [
  { value: 'Ad hoc', label: 'Ad hoc engagement', description: 'Drop in when it suits you' },
  { value: 'Weekly', label: 'Once a week', description: 'Regular weekly commitment' },
  { value: 'Twice weekly', label: 'Twice a week', description: 'More frequent engagement' },
  { value: 'Three or more', label: '3 or more times a week', description: 'Highly active participation' },
]

const preferenceOptions = [
  'Movement',
  'Creative',
  'Caregiver sessions',
  'Morning sessions',
  'Afternoon sessions',
]

const mobilityOptions = [
  { value: 'can walk', label: 'I can walk without assistance' },
  { value: 'cannot walk long distances', label: 'I cannot walk long distances' },
  { value: 'cannot walk', label: 'I use a wheelchair or mobility aid' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const { user, updateOnboarding, isLoading } = useAuth()
  
  const [step, setStep] = useState(1)
  const [membership, setMembership] = useState('')
  const [preferences, setPreferences] = useState<string[]>([])
  const [disabilities, setDisabilities] = useState('')
  const [mobilityStatus, setMobilityStatus] = useState('')
  const [homeAddress, setHomeAddress] = useState('')
  const [homeCoordinates, setHomeCoordinates] = useState({ lat: 1.3521, lng: 103.8198 })
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect if not logged in or not a participant
  if (!isLoading && (!user || user.role !== 'participant')) {
    router.push('/participant')
    return null
  }

  // Redirect if already onboarded
  if (!isLoading && user?.onboardingComplete) {
    router.push('/participant/dashboard')
    return null
  }

  const handlePreferenceToggle = (pref: string) => {
    setPreferences(prev => 
      prev.includes(pref) 
        ? prev.filter(p => p !== pref)
        : [...prev, pref]
    )
  }

  const handleNext = () => {
    setError(null)
    if (step === 1 && !membership) {
      setError('Please select a membership type')
      return
    }
    if (step === 2 && !mobilityStatus) {
      setError('Please select your mobility status')
      return
    }
    if (step === 3 && !homeAddress) {
      setError('Please enter your home address')
      return
    }
    setStep(step + 1)
  }

  const handleBack = () => {
    setStep(step - 1)
    setError(null)
  }

  const handleComplete = async () => {
    setError(null)
    setIsSubmitting(true)

    const result = await updateOnboarding({
      membership,
      preferences,
      disabilities,
      mobilityStatus,
      homeAddress,
      homeCoordinates,
    })

    if (result.success) {
      router.push('/participant/dashboard')
    } else {
      setError(result.error || 'Failed to complete onboarding')
    }

    setIsSubmitting(false)
  }

  if (isLoading) {
    return (
      <main className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div>Loading...</div>
      </main>
    )
  }

  return (
    <main className="page">
      <section className="container" style={{ maxWidth: '600px', padding: '48px 24px' }}>
        <div style={{ 
          background: 'var(--card)', 
          borderRadius: 'var(--radius-lg)', 
          padding: '40px',
          boxShadow: 'var(--shadow)'
        }}>
          {/* Progress indicator */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  style={{
                    width: '40px',
                    height: '4px',
                    borderRadius: '2px',
                    background: s <= step ? 'var(--accent)' : 'var(--line)',
                    transition: 'background 0.3s ease'
                  }}
                />
              ))}
            </div>
            <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.9rem' }}>
              Step {step} of 4
            </p>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>
              Welcome, {user?.name}! 👋
            </h1>
            <p style={{ color: 'var(--muted)' }}>
              {step === 1 && "Let's start by understanding your engagement preferences."}
              {step === 2 && "Tell us about your accessibility needs."}
              {step === 3 && "Where do you live? This helps us show travel directions."}
              {step === 4 && "Almost done! Review your preferences."}
            </p>
          </div>

          {error && (
            <div style={{
              background: 'var(--toast-error-bg)',
              border: '1px solid var(--toast-error-border)',
              color: 'var(--toast-error-text)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '24px',
              fontSize: '0.9rem'
            }}>
              {error}
            </div>
          )}

          {/* Step 1: Membership */}
          {step === 1 && (
            <div>
              <h2 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>
                How often would you like to participate?
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {membershipOptions.map((option) => (
                  <label
                    key={option.value}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      padding: '16px',
                      border: `2px solid ${membership === option.value ? 'var(--accent)' : 'var(--line)'}`,
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      background: membership === option.value ? 'var(--accent-soft)' : 'transparent',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <input
                      type="radio"
                      name="membership"
                      value={option.value}
                      checked={membership === option.value}
                      onChange={(e) => setMembership(e.target.value)}
                      style={{ marginRight: '12px', marginTop: '2px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600 }}>{option.label}</div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{option.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Accessibility */}
          {step === 2 && (
            <div>
              <h2 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>
                Mobility Status
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                {mobilityOptions.map((option) => (
                  <label
                    key={option.value}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '16px',
                      border: `2px solid ${mobilityStatus === option.value ? 'var(--accent)' : 'var(--line)'}`,
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      background: mobilityStatus === option.value ? 'var(--accent-soft)' : 'transparent',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <input
                      type="radio"
                      name="mobility"
                      value={option.value}
                      checked={mobilityStatus === option.value}
                      onChange={(e) => setMobilityStatus(e.target.value)}
                      style={{ marginRight: '12px' }}
                    />
                    <span style={{ fontWeight: 500 }}>{option.label}</span>
                  </label>
                ))}
              </div>

              <h2 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>
                Disabilities or Special Requirements (Optional)
              </h2>
              <textarea
                value={disabilities}
                onChange={(e) => setDisabilities(e.target.value)}
                placeholder="Let us know about any disabilities or special requirements we should be aware of..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '1rem',
                  background: 'var(--paper)',
                  minHeight: '100px',
                  resize: 'vertical'
                }}
              />

              <h2 style={{ fontSize: '1.1rem', marginTop: '24px', marginBottom: '16px' }}>
                Activity Preferences (Optional)
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {preferenceOptions.map((pref) => (
                  <button
                    key={pref}
                    type="button"
                    onClick={() => handlePreferenceToggle(pref)}
                    style={{
                      padding: '8px 16px',
                      border: `2px solid ${preferences.includes(pref) ? 'var(--accent)' : 'var(--line)'}`,
                      borderRadius: '999px',
                      background: preferences.includes(pref) ? 'var(--accent)' : 'transparent',
                      color: preferences.includes(pref) ? 'white' : 'var(--ink)',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: 500,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {pref}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Home Address */}
          {step === 3 && (
            <div>
              <h2 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>
                📍 Your Home Address
              </h2>
              <p style={{ color: 'var(--muted)', marginBottom: '16px', fontSize: '0.9rem' }}>
                This helps us show you directions to activities. Your address is kept private.
              </p>
              <LocationPicker
                address={homeAddress}
                coordinates={homeCoordinates}
                onAddressChange={setHomeAddress}
                onCoordinatesChange={setHomeCoordinates}
              />
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div>
              <h2 style={{ fontSize: '1.1rem', marginBottom: '24px' }}>
                Review Your Profile
              </h2>
              
              <div style={{ 
                background: 'var(--paper)', 
                padding: '20px', 
                borderRadius: 'var(--radius-sm)',
                marginBottom: '16px'
              }}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '4px' }}>Engagement Level</div>
                  <div style={{ fontWeight: 600 }}>
                    {membershipOptions.find(m => m.value === membership)?.label}
                  </div>
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '4px' }}>Mobility Status</div>
                  <div style={{ fontWeight: 600 }}>
                    {mobilityOptions.find(m => m.value === mobilityStatus)?.label}
                  </div>
                </div>

                {disabilities && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '4px' }}>Special Requirements</div>
                    <div>{disabilities}</div>
                  </div>
                )}

                {preferences.length > 0 && (
                  <div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '8px' }}>Preferences</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {preferences.map(pref => (
                        <span
                          key={pref}
                          style={{
                            padding: '4px 12px',
                            background: 'var(--accent-soft)',
                            borderRadius: '999px',
                            fontSize: '0.85rem'
                          }}
                        >
                          {pref}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {homeAddress && (
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '4px' }}>Home Address</div>
                    <div style={{ fontSize: '0.9rem' }}>{homeAddress}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div style={{ 
            display: 'flex', 
            justifyContent: step === 1 ? 'flex-end' : 'space-between',
            marginTop: '32px',
            gap: '16px'
          }}>
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="button outline"
                style={{ padding: '12px 24px' }}
              >
                Back
              </button>
            )}
            
            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="button primary"
                style={{ padding: '12px 32px' }}
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={handleComplete}
                disabled={isSubmitting}
                className="button primary"
                style={{ 
                  padding: '12px 32px',
                  opacity: isSubmitting ? 0.7 : 1
                }}
              >
                {isSubmitting ? 'Saving...' : 'Complete Setup'}
              </button>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
