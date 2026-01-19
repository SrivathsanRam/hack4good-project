import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { Activity, Registration, User } from '../models'

dotenv.config()

const activities = [
  {
    id: 'act-01',
    title: 'Morning Movement',
    date: '2026-01-20',
    startTime: '09:30',
    endTime: '10:30',
    location: 'Studio A',
    coordinates: { lat: 1.3521, lng: 103.8198 },
    program: 'Movement',
    role: 'Participants',
    capacity: 12,
    seatsLeft: 10,
    cadence: 'Weekly',
    description: 'Gentle movement and stretching for all mobility levels.',
    wheelchairAccessible: true,
    paymentRequired: false,
  },
  {
    id: 'act-02',
    title: 'Creative Collage Lab',
    date: '2026-01-20',
    startTime: '11:00',
    endTime: '12:30',
    location: 'Art Room',
    coordinates: { lat: 1.3525, lng: 103.8201 },
    program: 'Creative',
    role: 'Participants',
    capacity: 16,
    seatsLeft: 14,
    cadence: 'Weekly',
    description: 'Hands-on art session with guided materials.',
    wheelchairAccessible: true,
    paymentRequired: true,
    paymentAmount: 15,
  },
  {
    id: 'act-03',
    title: 'Caregiver Circle',
    date: '2026-01-21',
    startTime: '14:00',
    endTime: '15:30',
    location: 'Community Lounge',
    coordinates: { lat: 1.3518, lng: 103.8195 },
    program: 'Caregiver sessions',
    role: 'Participants',
    capacity: 10,
    seatsLeft: 9,
    cadence: 'Ad hoc',
    description: 'Peer support and resource sharing for caregivers.',
    wheelchairAccessible: true,
    paymentRequired: false,
  },
  {
    id: 'act-04',
    title: 'Movement Support Volunteer',
    date: '2026-01-22',
    startTime: '09:00',
    endTime: '10:00',
    location: 'Studio A',
    coordinates: { lat: 1.3521, lng: 103.8198 },
    program: 'Movement',
    role: 'Volunteers',
    capacity: 4,
    seatsLeft: 3,
    cadence: 'Weekly',
    description: 'Assist facilitators with setup and participant check-in.',
    wheelchairAccessible: true,
    paymentRequired: false,
  },
  {
    id: 'act-05',
    title: 'Creative Studio Setup',
    date: '2026-01-22',
    startTime: '10:30',
    endTime: '11:30',
    location: 'Art Room',
    coordinates: { lat: 1.3525, lng: 103.8201 },
    program: 'Creative',
    role: 'Volunteers',
    capacity: 6,
    seatsLeft: 4,
    cadence: 'Weekly',
    description: 'Help prepare materials and support artists.',
    wheelchairAccessible: false,
    paymentRequired: false,
  },
  {
    id: 'act-06',
    title: 'Afternoon Movement',
    date: '2026-01-23',
    startTime: '15:00',
    endTime: '16:00',
    location: 'Studio B',
    coordinates: { lat: 1.3530, lng: 103.8210 },
    program: 'Movement',
    role: 'Participants',
    capacity: 14,
    seatsLeft: 10,
    cadence: 'Twice weekly',
    description: 'Midday movement session with adaptive options.',
    wheelchairAccessible: true,
    paymentRequired: true,
    paymentAmount: 10,
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

// Sample users for testing (password is 'password123' for all)
const users = [
  {
    id: 'user-participant-01',
    email: 'participant@example.com',
    password: 'password123',
    name: 'Test Participant',
    role: 'participant',
    membership: 'Weekly',
    preferences: ['Movement', 'Morning sessions'],
    disabilities: '',
    mobilityStatus: 'can walk',
    onboardingComplete: true,
  },
  {
    id: 'user-volunteer-01',
    email: 'volunteer@example.com',
    password: 'password123',
    name: 'Test Volunteer',
    role: 'volunteer',
    onboardingComplete: true,
  },
  {
    id: 'user-staff-01',
    email: 'staff@example.com',
    password: 'password123',
    name: 'Sarah Chen',
    role: 'staff',
    onboardingComplete: true,
  },
  {
    id: 'user-staff-02',
    email: 'marcus@example.com',
    password: 'password123',
    name: 'Marcus Wong',
    role: 'staff',
    onboardingComplete: true,
  },
  {
    id: 'user-staff-03',
    email: 'priya@example.com',
    password: 'password123',
    name: 'Priya Sharma',
    role: 'staff',
    onboardingComplete: true,
  },
  {
    id: 'user-staff-04',
    email: 'james@example.com',
    password: 'password123',
    name: 'James Tan',
    role: 'staff',
    onboardingComplete: true,
  },
  {
    id: 'user-staff-05',
    email: 'emily@example.com',
    password: 'password123',
    name: 'Emily Lim',
    role: 'staff',
    onboardingComplete: true,
  },
  {
    id: 'user-staff-06',
    email: 'david@example.com',
    password: 'password123',
    name: 'David Ng',
    role: 'staff',
    onboardingComplete: true,
  },
]

const seedDatabase = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hack4good'
    
    console.log('Connecting to MongoDB...')
    console.log('URI:', mongoURI.replace(/\/\/.*:.*@/, '//<credentials>@')) // Log URI without password
    
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    })
    console.log('✓ Connected to MongoDB')

    // Clear existing data
    console.log('Clearing existing data...')
    await Activity.deleteMany({})
    await Registration.deleteMany({})
    await User.deleteMany({})
    console.log('✓ Cleared existing data')

    // Seed activities
    console.log('Seeding activities...')
    await Activity.insertMany(activities)
    console.log(`✓ Seeded ${activities.length} activities`)

    // Seed registrations
    console.log('Seeding registrations...')
    await Registration.insertMany(registrations)
    console.log(`✓ Seeded ${registrations.length} registrations`)

    // Seed users (using create to trigger password hashing)
    console.log('Seeding users...')
    for (const userData of users) {
      await User.create(userData)
    }
    console.log(`✓ Seeded ${users.length} users`)

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
