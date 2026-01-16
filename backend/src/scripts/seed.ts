import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { Activity, Registration } from '../models'

dotenv.config()

const activities = [
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

const registrations = [
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
  },
]

const seedDatabase = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hack4good'
    
    console.log('Connecting to MongoDB...')
    await mongoose.connect(mongoURI)
    console.log('✓ Connected to MongoDB')

    // Clear existing data
    console.log('Clearing existing data...')
    await Activity.deleteMany({})
    await Registration.deleteMany({})
    console.log('✓ Cleared existing data')

    // Seed activities
    console.log('Seeding activities...')
    await Activity.insertMany(activities)
    console.log(`✓ Seeded ${activities.length} activities`)

    // Seed registrations
    console.log('Seeding registrations...')
    await Registration.insertMany(registrations)
    console.log(`✓ Seeded ${registrations.length} registrations`)

    console.log('\n✓ Database seeded successfully!')
    
  } catch (error) {
    console.error('Error seeding database:', error)
  } finally {
    await mongoose.connection.close()
    console.log('✓ MongoDB connection closed')
    process.exit(0)
  }
}

seedDatabase()
