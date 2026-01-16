import express, { Express, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import connectDB from './config/database'
import { Activity, Registration } from './models'

dotenv.config()

const app: Express = express()
const port = process.env.PORT || 5000

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

// Get all activities with optional filters
app.get('/api/activities', async (req: Request, res: Response) => {
  try {
    const program = typeof req.query.program === 'string' ? req.query.program : ''
    const role = typeof req.query.role === 'string' ? req.query.role : ''

    const filter: Record<string, string> = {}
    if (program) filter.program = program
    if (role) filter.role = role

    const activities = await Activity.find(filter).sort({ date: 1, time: 1 })
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
      time,
      location,
      program,
      role,
      capacity,
      cadence,
      description = '',
    } = req.body || {}

    const capacityValue = Number(capacity)
    if (
      !title ||
      !date ||
      !time ||
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
      time,
      location,
      program,
      role,
      capacity: capacityValue,
      seatsLeft: capacityValue,
      cadence,
      description: typeof description === 'string' ? description : '',
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
    activity.time = updates.time ?? activity.time
    activity.location = updates.location ?? activity.location
    activity.program = updates.program ?? activity.program
    activity.role = updates.role ?? activity.role
    activity.cadence = updates.cadence ?? activity.cadence
    activity.description =
      typeof updates.description === 'string'
        ? updates.description
        : activity.description
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
