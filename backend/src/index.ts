import express, { Express, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import connectDB from './config/database'
import { Activity, Registration, User, Notification } from './models'

dotenv.config()

const app: Express = express()
const port = process.env.PORT || 5000
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// JWT middleware
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    res.status(401).json({ error: 'Access token required' })
    return
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      res.status(403).json({ error: 'Invalid or expired token' })
      return
    }
    (req as any).user = decoded
    next()
  })
}

// Connect to MongoDB
connectDB()

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Routes
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'Server is running', timestamp: new Date() })
})

app.get('/api/test', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to the Express backend!' })
})

// ============ AUTH ROUTES ============

// Sign up
app.post('/api/auth/signup', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body || {}

    if (!name || !email || !password || !role) {
      res.status(400).json({ error: 'Name, email, password, and role are required.' })
      return
    }

    if (!['participant', 'volunteer', 'staff'].includes(role)) {
      res.status(400).json({ error: 'Invalid role.' })
      return
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      res.status(409).json({ error: 'An account with this email already exists.' })
      return
    }

    const user = new User({
      id: `user-${Date.now()}`,
      name,
      email: email.toLowerCase(),
      password,
      role,
      onboardingComplete: role !== 'participant', // Only participants need onboarding
    })

    await user.save()

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        onboardingComplete: user.onboardingComplete,
      },
    })
  } catch (error) {
    console.error('Error signing up:', error)
    res.status(500).json({ error: 'Failed to create account' })
  }
})

// Login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body || {}

    if (!email || !password || !role) {
      res.status(400).json({ error: 'Email, password, and role are required.' })
      return
    }

    const user = await User.findOne({ email: email.toLowerCase(), role })
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' })
      return
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' })
      return
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        membership: user.membership,
        preferences: user.preferences,
        disabilities: user.disabilities,
        mobilityStatus: user.mobilityStatus,
        onboardingComplete: user.onboardingComplete,
      },
    })
  } catch (error) {
    console.error('Error logging in:', error)
    res.status(500).json({ error: 'Failed to log in' })
  }
})

// Complete onboarding (for participants)
app.post('/api/auth/onboarding', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { membership, preferences, disabilities, mobilityStatus, homeAddress, homeCoordinates } = req.body || {}
    const userId = (req as any).user.id

    const user = await User.findOne({ id: userId })
    if (!user) {
      res.status(404).json({ error: 'User not found.' })
      return
    }

    if (user.role !== 'participant') {
      res.status(400).json({ error: 'Only participants can complete onboarding.' })
      return
    }

    user.membership = membership
    user.preferences = preferences || []
    user.disabilities = disabilities || ''
    user.mobilityStatus = mobilityStatus
    user.homeAddress = homeAddress || ''
    user.homeCoordinates = homeCoordinates || undefined
    user.onboardingComplete = true

    await user.save()

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        membership: user.membership,
        preferences: user.preferences,
        disabilities: user.disabilities,
        mobilityStatus: user.mobilityStatus,
        homeAddress: user.homeAddress,
        homeCoordinates: user.homeCoordinates,
        onboardingComplete: user.onboardingComplete,
      },
    })
  } catch (error) {
    console.error('Error completing onboarding:', error)
    res.status(500).json({ error: 'Failed to complete onboarding' })
  }
})

// Get current user
app.get('/api/auth/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id
    const user = await User.findOne({ id: userId })

    if (!user) {
      res.status(404).json({ error: 'User not found.' })
      return
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        membership: user.membership,
        preferences: user.preferences,
        disabilities: user.disabilities,
        mobilityStatus: user.mobilityStatus,
        onboardingComplete: user.onboardingComplete,
      },
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    res.status(500).json({ error: 'Failed to fetch user' })
  }
})

// ============ ACTIVITY ROUTES ============

// Get all activities with optional filters
app.get('/api/activities', async (req: Request, res: Response) => {
  try {
    const program = typeof req.query.program === 'string' ? req.query.program : ''
    const role = typeof req.query.role === 'string' ? req.query.role : ''

    const filter: Record<string, any> = {}
    if (program) filter.program = program
    if (role) filter.roles = { $in: [role] }

    const activities = await Activity.find(filter).sort({ date: 1, startTime: 1 })
    res.json({ data: activities })
  } catch (error) {
    console.error('Error fetching activities:', error)
    res.status(500).json({ error: 'Failed to fetch activities' })
  }
})

// Get staff users for dropdown
app.get('/api/users/staff', async (req: Request, res: Response) => {
  try {
    const staffUsers = await User.find({ role: 'staff' })
    const formattedUsers = staffUsers.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email
    }))
    res.json({ data: formattedUsers })
  } catch (error) {
    console.error('Error fetching staff users:', error)
    res.status(500).json({ error: 'Failed to fetch staff users' })
  }
})

// Get single activity by ID
app.get('/api/activities/:id', async (req: Request, res: Response) => {
  try {
    const activity = await Activity.findOne({ id: req.params.id })

    if (!activity) {
      res.status(404).json({ error: 'Activity not found.' })
      return
    }

    res.json({ data: activity })
  } catch (error) {
    console.error('Error fetching activity:', error)
    res.status(500).json({ error: 'Failed to fetch activity' })
  }
})

// Create new activity
app.post('/api/activities', async (req: Request, res: Response) => {
  try {
    const {
      title,
      date,
      startTime,
      endTime,
      location,
      address,
      coordinates,
      program,
      roles,
      participantCapacity,
      volunteerCapacity,
      type,
      description = '',
      imageUrl = '',
      wheelchairAccessible = false,
      paymentRequired = false,
      paymentAmount,
      staffPresent = [],
      contactIC = '',
    } = req.body || {}

    if (
      !title ||
      !date ||
      !startTime ||
      !endTime ||
      !location ||
      !program ||
      !roles ||
      !type
    ) {
      res.status(400).json({ error: 'Missing required activity fields.' })
      return
    }

    const newActivity = new Activity({
      id: `act-${Date.now()}`,
      title,
      date,
      startTime,
      endTime,
      location,
      address: address || '',
      coordinates: coordinates || { lat: 1.3521, lng: 103.8198 },
      program,
      roles: Array.isArray(roles) ? roles : [roles],
      participantCapacity: Number(participantCapacity) || 0,
      volunteerCapacity: Number(volunteerCapacity) || 0,
      participantSeatsLeft: Number(participantCapacity) || 0,
      volunteerSeatsLeft: Number(volunteerCapacity) || 0,
      type,
      description: typeof description === 'string' ? description : '',
      imageUrl: typeof imageUrl === 'string' ? imageUrl : '',
      wheelchairAccessible: Boolean(wheelchairAccessible),
      paymentRequired: Boolean(paymentRequired),
      paymentAmount: paymentRequired ? Number(paymentAmount) || 0 : undefined,
      staffPresent: Array.isArray(staffPresent) ? staffPresent : [],
      contactIC: typeof contactIC === 'string' ? contactIC : '',
    })

    await newActivity.save()
    res.status(201).json({ data: newActivity })
  } catch (error) {
    console.error('Error creating activity:', error)
    res.status(500).json({ error: 'Failed to create activity' })
  }
})

// Update activity
app.patch('/api/activities/:id', async (req: Request, res: Response) => {
  try {
    const activity = await Activity.findOne({ id: req.params.id })

    if (!activity) {
      res.status(404).json({ error: 'Activity not found.' })
      return
    }

    const updates = req.body || {}

    activity.title = updates.title ?? activity.title
    activity.date = updates.date ?? activity.date
    activity.startTime = updates.startTime ?? activity.startTime
    activity.endTime = updates.endTime ?? activity.endTime
    activity.location = updates.location ?? activity.location
    activity.address = updates.address ?? activity.address
    if (updates.coordinates) {
      activity.coordinates = updates.coordinates
    }
    activity.program = updates.program ?? activity.program
    if (updates.roles) {
      activity.roles = Array.isArray(updates.roles) ? updates.roles : [updates.roles]
    }
    activity.type = updates.type ?? activity.type
    activity.description =
      typeof updates.description === 'string'
        ? updates.description
        : activity.description
    if (updates.imageUrl !== undefined) {
      activity.imageUrl = updates.imageUrl
    }
    activity.wheelchairAccessible = updates.wheelchairAccessible ?? activity.wheelchairAccessible
    activity.paymentRequired = updates.paymentRequired ?? activity.paymentRequired
    if (updates.paymentAmount !== undefined) {
      activity.paymentAmount = Number(updates.paymentAmount)
    }
    if (updates.participantCapacity !== undefined) {
      const occupied = activity.participantCapacity - activity.participantSeatsLeft
      activity.participantCapacity = Number(updates.participantCapacity) || 0
      activity.participantSeatsLeft = Math.max(activity.participantCapacity - occupied, 0)
    }
    if (updates.volunteerCapacity !== undefined) {
      const occupied = activity.volunteerCapacity - activity.volunteerSeatsLeft
      activity.volunteerCapacity = Number(updates.volunteerCapacity) || 0
      activity.volunteerSeatsLeft = Math.max(activity.volunteerCapacity - occupied, 0)
    }
    if (updates.staffPresent !== undefined) {
      activity.staffPresent = Array.isArray(updates.staffPresent) ? updates.staffPresent : []
    }
    if (updates.contactIC !== undefined) {
      activity.contactIC = updates.contactIC
    }

    await activity.save()
    res.json({ data: activity })
  } catch (error) {
    console.error('Error updating activity:', error)
    res.status(500).json({ error: 'Failed to update activity' })
  }
})

// Delete activity
app.delete('/api/activities/:id', async (req: Request, res: Response) => {
  try {
    const activity = await Activity.findOneAndDelete({ id: req.params.id })

    if (!activity) {
      res.status(404).json({ error: 'Activity not found.' })
      return
    }

    // Also delete related registrations
    await Registration.deleteMany({ activityId: req.params.id })

    res.json({ message: 'Activity deleted successfully' })
  } catch (error) {
    console.error('Error deleting activity:', error)
    res.status(500).json({ error: 'Failed to delete activity' })
  }
})

// Get featured activity
app.get('/api/activities/featured/current', async (req: Request, res: Response) => {
  try {
    const featuredActivity = await Activity.findOne({ featured: true })
    res.json({ data: featuredActivity })
  } catch (error) {
    console.error('Error fetching featured activity:', error)
    res.status(500).json({ error: 'Failed to fetch featured activity' })
  }
})

// Set featured activity
app.post('/api/activities/:id/feature', async (req: Request, res: Response) => {
  try {
    // First, unset any existing featured activity
    await Activity.updateMany({}, { featured: false })

    // Then set the new featured activity
    const activity = await Activity.findOneAndUpdate(
      { id: req.params.id },
      { featured: true },
      { new: true }
    )

    if (!activity) {
      res.status(404).json({ error: 'Activity not found.' })
      return
    }

    res.json({ data: activity, message: 'Activity is now featured' })
  } catch (error) {
    console.error('Error setting featured activity:', error)
    res.status(500).json({ error: 'Failed to set featured activity' })
  }
})

// Unset featured activity
app.delete('/api/activities/:id/feature', async (req: Request, res: Response) => {
  try {
    const activity = await Activity.findOneAndUpdate(
      { id: req.params.id },
      { featured: false },
      { new: true }
    )

    if (!activity) {
      res.status(404).json({ error: 'Activity not found.' })
      return
    }

    res.json({ data: activity, message: 'Activity is no longer featured' })
  } catch (error) {
    console.error('Error unsetting featured activity:', error)
    res.status(500).json({ error: 'Failed to unset featured activity' })
  }
})

// Create registration
app.post('/api/registrations', async (req: Request, res: Response) => {
  try {
    const {
      activityId,
      name,
      email,
      role,
      membership,
      accessibility = false,
      caregiverPayment = false,
      notes = '',
    } = req.body || {}

    if (!activityId || !name || !email || !role || !membership) {
      res.status(400).json({ error: 'Missing required fields.' })
      return
    }

    const activity = await Activity.findOne({ id: activityId })
    if (!activity) {
      res.status(404).json({ error: 'Activity not found.' })
      return
    }

    // Check seats based on registration role
    const isVolunteer = role === 'Volunteer'
    const availableSeats = isVolunteer 
      ? activity.volunteerSeatsLeft 
      : activity.participantSeatsLeft

    if (availableSeats <= 0) {
      res.status(409).json({ error: 'No seats left for this activity.' })
      return
    }

    const registration = new Registration({
      id: `reg-${Date.now()}`,
      activityId,
      name,
      email,
      role,
      membership,
      accessibility: Boolean(accessibility),
      caregiverPayment: Boolean(caregiverPayment),
      notes: typeof notes === 'string' ? notes : '',
      attended: false,
    })

    // Update seats left based on registration role
    if (isVolunteer) {
      activity.volunteerSeatsLeft = Math.max(activity.volunteerSeatsLeft - 1, 0)
    } else {
      activity.participantSeatsLeft = Math.max(activity.participantSeatsLeft - 1, 0)
    }
    
    await Promise.all([registration.save(), activity.save()])
    res.status(201).json({ data: registration })
  } catch (error) {
    console.error('Error creating registration:', error)
    res.status(500).json({ error: 'Failed to create registration' })
  }
})

// Get registrations with optional activityId filter
app.get('/api/registrations', async (req: Request, res: Response) => {
  try {
    const activityId =
      typeof req.query.activityId === 'string' ? req.query.activityId : ''

    const filter = activityId ? { activityId } : {}
    const registrations = await Registration.find(filter).sort({ createdAt: -1 })

    res.json({ data: registrations })
  } catch (error) {
    console.error('Error fetching registrations:', error)
    res.status(500).json({ error: 'Failed to fetch registrations' })
  }
})

// Update registration attendance
app.patch('/api/registrations/:id', async (req: Request, res: Response) => {
  try {
    const registration = await Registration.findOne({ id: req.params.id })

    if (!registration) {
      res.status(404).json({ error: 'Registration not found.' })
      return
    }

    if (typeof req.body?.attended !== 'boolean') {
      res.status(400).json({ error: 'Attended must be true or false.' })
      return
    }

    registration.attended = req.body.attended
    await registration.save()

    res.json({ data: registration })
  } catch (error) {
    console.error('Error updating registration:', error)
    res.status(500).json({ error: 'Failed to update registration' })
  }
})

// Delete registration by activityId and email (for uncommitting)
app.delete('/api/registrations/by-activity/:activityId', async (req: Request, res: Response) => {
  try {
    const { activityId } = req.params
    const { email, role } = req.query

    if (!email) {
      res.status(400).json({ error: 'Email is required' })
      return
    }

    const registration = await Registration.findOne({ 
      activityId, 
      email: String(email).toLowerCase(),
      ...(role ? { role: String(role) } : {})
    })

    if (!registration) {
      res.status(404).json({ error: 'Registration not found.' })
      return
    }

    // Restore seat in the activity based on registration role
    const activity = await Activity.findOne({ id: registration.activityId })
    if (activity) {
      const isVolunteer = registration.role === 'Volunteer'
      if (isVolunteer && activity.volunteerSeatsLeft < activity.volunteerCapacity) {
        activity.volunteerSeatsLeft += 1
        await activity.save()
      } else if (!isVolunteer && activity.participantSeatsLeft < activity.participantCapacity) {
        activity.participantSeatsLeft += 1
        await activity.save()
      }
    }

    await Registration.deleteOne({ id: registration.id })
    res.json({ message: 'Registration deleted successfully' })
  } catch (error) {
    console.error('Error deleting registration by activity:', error)
    res.status(500).json({ error: 'Failed to delete registration' })
  }
})

// Delete registration by id
app.delete('/api/registrations/:id', async (req: Request, res: Response) => {
  try {
    const registration = await Registration.findOne({ id: req.params.id })

    if (!registration) {
      res.status(404).json({ error: 'Registration not found.' })
      return
    }

    // Restore seat in the activity based on registration role
    const activity = await Activity.findOne({ id: registration.activityId })
    if (activity) {
      const isVolunteer = registration.role === 'Volunteer'
      if (isVolunteer && activity.volunteerSeatsLeft < activity.volunteerCapacity) {
        activity.volunteerSeatsLeft += 1
        await activity.save()
      } else if (!isVolunteer && activity.participantSeatsLeft < activity.participantCapacity) {
        activity.participantSeatsLeft += 1
        await activity.save()
      }
    }

    await Registration.deleteOne({ id: req.params.id })
    res.json({ message: 'Registration deleted successfully' })
  } catch (error) {
    console.error('Error deleting registration:', error)
    res.status(500).json({ error: 'Failed to delete registration' })
  }
})

// ============ NOTIFICATION ROUTES ============

// Get all notifications (admin)
app.get('/api/notifications', async (req: Request, res: Response) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 })
    res.json({ success: true, data: notifications })
  } catch (err: any) {
    console.error('Error fetching notifications:', err)
    res.status(500).json({ error: err.message })
  }
})

// Get notifications for a specific user (based on their role and experience)
app.get('/api/notifications/user/:email', async (req: Request, res: Response) => {
  try {
    const { email } = req.params
    
    // Find the user
    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }
    
    // Count completed volunteer activities for experience check
    const volunteerRegistrations = await Registration.find({
      email: email.toLowerCase(),
      role: 'Volunteer',
      attended: true
    })
    const isExperienced = volunteerRegistrations.length >= 5 // 5+ completed activities = experienced
    
    // Build query for applicable notifications
    const now = new Date()
    const audienceFilter: string[] = ['all']
    
    if (user.role === 'participant') {
      audienceFilter.push('participants')
    } else if (user.role === 'volunteer') {
      audienceFilter.push('volunteers')
      if (isExperienced) {
        audienceFilter.push('experienced_volunteers')
      }
    }
    
    const notifications = await Notification.find({
      targetAudience: { $in: audienceFilter },
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: now } }
      ]
    }).sort({ createdAt: -1 }).limit(20)
    
    // Add read status to each notification
    const notificationsWithReadStatus = notifications.map(n => ({
      ...n.toObject(),
      isRead: n.read.includes(user.id)
    }))
    
    res.json({ 
      success: true, 
      data: notificationsWithReadStatus,
      isExperiencedVolunteer: isExperienced,
      completedActivities: volunteerRegistrations.length
    })
  } catch (err: any) {
    console.error('Error fetching user notifications:', err)
    res.status(500).json({ error: err.message })
  }
})

// Create a new notification (admin only)
app.post('/api/notifications', async (req: Request, res: Response) => {
  try {
    const { title, message, type, targetAudience, activityId, createdBy, expiresAt } = req.body
    
    if (!title || !message || !type || !targetAudience || !createdBy) {
      res.status(400).json({ error: 'Title, message, type, targetAudience, and createdBy are required' })
      return
    }
    
    // Validate expiration date is in the future
    let parsedExpiresAt = null
    if (expiresAt) {
      parsedExpiresAt = new Date(expiresAt)
      if (parsedExpiresAt <= new Date()) {
        res.status(400).json({ error: 'Expiration date must be in the future' })
        return
      }
    }
    
    const notification = new Notification({
      id: `notif-${Date.now()}`,
      title,
      message,
      type,
      targetAudience,
      activityId: activityId || null,
      createdBy,
      expiresAt: parsedExpiresAt,
      read: []
    })
    
    await notification.save()
    
    res.status(201).json({ success: true, data: notification })
  } catch (err: any) {
    console.error('Error creating notification:', err)
    res.status(500).json({ error: err.message })
  }
})

// Mark notification as read
app.post('/api/notifications/:id/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { userId } = req.body
    
    if (!userId) {
      res.status(400).json({ error: 'userId is required' })
      return
    }
    
    const notification = await Notification.findOne({ id })
    if (!notification) {
      res.status(404).json({ error: 'Notification not found' })
      return
    }
    
    // Add userId to read array if not already present
    if (!notification.read.includes(userId)) {
      notification.read.push(userId)
      await notification.save()
    }
    
    res.json({ success: true, data: notification })
  } catch (err: any) {
    console.error('Error marking notification as read:', err)
    res.status(500).json({ error: err.message })
  }
})

// Delete a notification (admin only)
app.delete('/api/notifications/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    const notification = await Notification.findOneAndDelete({ id })
    if (!notification) {
      res.status(404).json({ error: 'Notification not found' })
      return
    }
    
    res.json({ success: true, message: 'Notification deleted' })
  } catch (err: any) {
    console.error('Error deleting notification:', err)
    res.status(500).json({ error: err.message })
  }
})

// Get experienced volunteers list (for admin reference)
app.get('/api/volunteers/experienced', async (req: Request, res: Response) => {
  try {
    // Find all volunteers
    const volunteers = await User.find({ role: 'volunteer' })
    
    // For each volunteer, count their attended activities
    const experiencedVolunteers = []
    for (const volunteer of volunteers) {
      const attendedCount = await Registration.countDocuments({
        email: volunteer.email,
        role: 'Volunteer',
        attended: true
      })
      
      if (attendedCount >= 5) {
        experiencedVolunteers.push({
          id: volunteer.id,
          name: volunteer.name,
          email: volunteer.email,
          completedActivities: attendedCount
        })
      }
    }
    
    res.json({ success: true, data: experiencedVolunteers })
  } catch (err: any) {
    console.error('Error fetching experienced volunteers:', err)
    res.status(500).json({ error: err.message })
  }
})

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal Server Error' })
})

// Start server
app.listen(port, () => {
  console.log(`✓ Server is running on http://localhost:${port}`)
})
