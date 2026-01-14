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
    seatsLeft: 3,
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
    seatsLeft: 6,
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
    seatsLeft: 2,
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
    seatsLeft: 1,
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
    seatsLeft: 2,
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
    seatsLeft: 5,
    cadence: 'Twice weekly',
    description: 'Midday movement session with adaptive options.',
  },
]

const registrations: Registration[] = []

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
    createdAt: new Date().toISOString(),
  }

  registrations.push(registration)

  res.status(201).json({ data: registration })
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
