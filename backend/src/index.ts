import express, { Express, Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app: Express = express()
const port = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

type Activity = {
  id: string
  title: string
  date: string
  time: string
  location: string
  program: string
  role: 'Participants' | 'Volunteers'
  capacity: number
  seatsLeft: number
  cadence: string
  description: string
}

type Registration = {
  id: string
  activityId: string
  name: string
  email: string
  role: 'Participant' | 'Volunteer'
  membership: string
  accessibility: boolean
  caregiverPayment: boolean
  notes: string
  attended: boolean
  createdAt: string
}

const activities: Activity[] = [
  {
    id: 'act-01',
    title: 'Morning Movement',
    date: '2024-04-10',
    time: '09:30',
    location: 'Studio A',
    program: 'Movement',
    role: 'Participants',
    capacity: 12,
    seatsLeft: 10,
    cadence: 'Weekly',
    description: 'Gentle movement and stretching for all mobility levels.',
  },
  {
    id: 'act-02',
    title: 'Creative Collage Lab',
    date: '2024-04-10',
    time: '11:00',
    location: 'Art Room',
    program: 'Creative',
    role: 'Participants',
    capacity: 16,
    seatsLeft: 16,
    cadence: 'Weekly',
    description: 'Hands-on art session with guided materials.',
  },
  {
    id: 'act-03',
    title: 'Caregiver Circle',
    date: '2024-04-11',
    time: '14:00',
    location: 'Community Lounge',
    program: 'Caregiver sessions',
    role: 'Participants',
    capacity: 10,
    seatsLeft: 10,
    cadence: 'Ad hoc',
    description: 'Peer support and resource sharing for caregivers.',
  },
  {
    id: 'act-04',
    title: 'Movement Support Volunteer',
    date: '2024-04-12',
    time: '09:00',
    location: 'Studio A',
    program: 'Movement',
    role: 'Volunteers',
    capacity: 4,
    seatsLeft: 3,
    cadence: 'Weekly',
    description: 'Assist facilitators with setup and participant check-in.',
  },
  {
    id: 'act-05',
    title: 'Creative Studio Setup',
    date: '2024-04-12',
    time: '10:30',
    location: 'Art Room',
    program: 'Creative',
    role: 'Volunteers',
    capacity: 6,
    seatsLeft: 6,
    cadence: 'Weekly',
    description: 'Help prepare materials and support artists.',
  },
  {
    id: 'act-06',
    title: 'Afternoon Movement',
    date: '2024-04-13',
    time: '15:00',
    location: 'Studio B',
    program: 'Movement',
    role: 'Participants',
    capacity: 14,
    seatsLeft: 14,
    cadence: 'Twice weekly',
    description: 'Midday movement session with adaptive options.',
  },
]

const registrations: Registration[] = [
  {
    id: 'reg-01',
    activityId: 'act-01',
    name: 'Renee Tan',
    email: 'renee.tan@example.com',
    role: 'Participant',
    membership: 'Weekly',
    accessibility: false,
    caregiverPayment: false,
    notes: '',
    attended: false,
    createdAt: '2024-04-01T09:00:00Z',
  },
  {
    id: 'reg-02',
    activityId: 'act-01',
    name: 'Sameer Singh',
    email: 'sameer.singh@example.com',
    role: 'Participant',
    membership: 'Weekly',
    accessibility: true,
    caregiverPayment: false,
    notes: 'Prefers aisle seating.',
    attended: true,
    createdAt: '2024-04-01T09:05:00Z',
  },
  {
    id: 'reg-03',
    activityId: 'act-04',
    name: 'Maya Chen',
    email: 'maya.chen@example.com',
    role: 'Volunteer',
    membership: 'Ad hoc',
    accessibility: false,
    caregiverPayment: false,
    notes: '',
    attended: true,
    createdAt: '2024-04-02T08:30:00Z',
  },
]

// Routes
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'Server is running', timestamp: new Date() })
})

app.get('/api/test', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to the Express backend!' })
})

app.get('/api/activities', (req: Request, res: Response) => {
  const program = typeof req.query.program === 'string' ? req.query.program : ''
  const role = typeof req.query.role === 'string' ? req.query.role : ''

  const filtered = activities.filter((activity) => {
    const matchesProgram = !program || activity.program === program
    const matchesRole = !role || activity.role === role
    return matchesProgram && matchesRole
  })

  res.json({ data: filtered })
})

app.get('/api/activities/:id', (req: Request, res: Response) => {
  const activity = activities.find((item) => item.id === req.params.id)

  if (!activity) {
    res.status(404).json({ error: 'Activity not found.' })
    return
  }

  res.json({ data: activity })
})

app.post('/api/activities', (req: Request, res: Response) => {
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

  const newActivity: Activity = {
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
  }

  activities.unshift(newActivity)

  res.status(201).json({ data: newActivity })
})

app.patch('/api/activities/:id', (req: Request, res: Response) => {
  const activityIndex = activities.findIndex(
    (item) => item.id === req.params.id
  )

  if (activityIndex === -1) {
    res.status(404).json({ error: 'Activity not found.' })
    return
  }

  const activity = activities[activityIndex]
  const updates = req.body || {}
  const nextCapacity =
    updates.capacity !== undefined ? Number(updates.capacity) : activity.capacity

  if (Number.isNaN(nextCapacity) || nextCapacity <= 0) {
    res.status(400).json({ error: 'Capacity must be a positive number.' })
    return
  }

  const occupied = activity.capacity - activity.seatsLeft
  const nextSeatsLeft = Math.max(nextCapacity - occupied, 0)

  const updated: Activity = {
    ...activity,
    title: updates.title ?? activity.title,
    date: updates.date ?? activity.date,
    time: updates.time ?? activity.time,
    location: updates.location ?? activity.location,
    program: updates.program ?? activity.program,
    role: updates.role ?? activity.role,
    cadence: updates.cadence ?? activity.cadence,
    description:
      typeof updates.description === 'string'
        ? updates.description
        : activity.description,
    capacity: nextCapacity,
    seatsLeft: nextSeatsLeft,
  }

  activities[activityIndex] = updated

  res.json({ data: updated })
})

app.post('/api/registrations', (req: Request, res: Response) => {
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

  const activity = activities.find((item) => item.id === activityId)
  if (!activity) {
    res.status(404).json({ error: 'Activity not found.' })
    return
  }

  if (activity.seatsLeft <= 0) {
    res.status(409).json({ error: 'No seats left for this activity.' })
    return
  }

  const registration: Registration = {
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
    createdAt: new Date().toISOString(),
  }

  activity.seatsLeft = Math.max(activity.seatsLeft - 1, 0)
  registrations.push(registration)

  res.status(201).json({ data: registration })
})

app.get('/api/registrations', (req: Request, res: Response) => {
  const activityId =
    typeof req.query.activityId === 'string' ? req.query.activityId : ''

  const filtered = activityId
    ? registrations.filter((record) => record.activityId === activityId)
    : registrations

  res.json({ data: filtered })
})

app.patch('/api/registrations/:id', (req: Request, res: Response) => {
  const registration = registrations.find((item) => item.id === req.params.id)

  if (!registration) {
    res.status(404).json({ error: 'Registration not found.' })
    return
  }

  if (typeof req.body?.attended !== 'boolean') {
    res.status(400).json({ error: 'Attended must be true or false.' })
    return
  }

  registration.attended = req.body.attended

  res.json({ data: registration })
})

// Error handling middleware
app.use((err: any, req: Request, res: Response) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal Server Error' })
})

// Start server
app.listen(port, () => {
  console.log(`✓ Server is running on http://localhost:${port}`)
})
