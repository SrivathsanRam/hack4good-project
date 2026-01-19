import express, { Express, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import connectDB from './config/database'
import { Activity, Registration, User } from './models'

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
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

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
    const { membership, preferences, disabilities, mobilityStatus } = req.body || {}
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

    const filter: Record<string, string> = {}
    if (program) filter.program = program
    if (role) filter.role = role

    const activities = await Activity.find(filter).sort({ date: 1, startTime: 1 })
    res.json({ data: activities })
  } catch (error) {
    console.error('Error fetching activities:', error)
    res.status(500).json({ error: 'Failed to fetch activities' })
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
      coordinates,
      program,
      role,
      capacity,
      cadence,
      description = '',
      wheelchairAccessible = false,
      paymentRequired = false,
      paymentAmount,
    } = req.body || {}

    const capacityValue = Number(capacity)
    if (
      !title ||
      !date ||
      !startTime ||
      !endTime ||
      !location ||
      !program ||
      !role ||
      !cadence ||
      !capacity ||
      Number.isNaN(capacityValue) ||
      capacityValue <= 0
    ) {
      res.status(400).json({ error: 'Missing or invalid activity fields.' })
      return
    }

    const newActivity = new Activity({
      id: `act-${Date.now()}`,
      title,
      date,
      startTime,
      endTime,
      location,
      coordinates: coordinates || { lat: 0, lng: 0 },
      program,
      role,
      capacity: capacityValue,
      seatsLeft: capacityValue,
      cadence,
      description: typeof description === 'string' ? description : '',
      wheelchairAccessible: Boolean(wheelchairAccessible),
      paymentRequired: Boolean(paymentRequired),
      paymentAmount: paymentRequired ? Number(paymentAmount) || 0 : undefined,
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
    const nextCapacity =
      updates.capacity !== undefined ? Number(updates.capacity) : activity.capacity

    if (Number.isNaN(nextCapacity) || nextCapacity <= 0) {
      res.status(400).json({ error: 'Capacity must be a positive number.' })
      return
    }

    const occupied = activity.capacity - activity.seatsLeft
    const nextSeatsLeft = Math.max(nextCapacity - occupied, 0)

    activity.title = updates.title ?? activity.title
    activity.date = updates.date ?? activity.date
    activity.startTime = updates.startTime ?? activity.startTime
    activity.endTime = updates.endTime ?? activity.endTime
    activity.location = updates.location ?? activity.location
    if (updates.coordinates) {
      activity.coordinates = updates.coordinates
    }
    activity.program = updates.program ?? activity.program
    activity.role = updates.role ?? activity.role
    activity.cadence = updates.cadence ?? activity.cadence
    activity.description =
      typeof updates.description === 'string'
        ? updates.description
        : activity.description
    activity.wheelchairAccessible = updates.wheelchairAccessible ?? activity.wheelchairAccessible
    activity.paymentRequired = updates.paymentRequired ?? activity.paymentRequired
    if (updates.paymentAmount !== undefined) {
      activity.paymentAmount = Number(updates.paymentAmount)
    }
    activity.capacity = nextCapacity
    activity.seatsLeft = nextSeatsLeft

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

    if (activity.seatsLeft <= 0) {
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

    // Update seats left
    activity.seatsLeft = Math.max(activity.seatsLeft - 1, 0)
    
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

// Delete registration
app.delete('/api/registrations/:id', async (req: Request, res: Response) => {
  try {
    const registration = await Registration.findOne({ id: req.params.id })

    if (!registration) {
      res.status(404).json({ error: 'Registration not found.' })
      return
    }

    // Restore seat in the activity
    const activity = await Activity.findOne({ id: registration.activityId })
    if (activity && activity.seatsLeft < activity.capacity) {
      activity.seatsLeft += 1
      await activity.save()
    }

    await Registration.deleteOne({ id: req.params.id })
    res.json({ message: 'Registration deleted successfully' })
  } catch (error) {
    console.error('Error deleting registration:', error)
    res.status(500).json({ error: 'Failed to delete registration' })
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
