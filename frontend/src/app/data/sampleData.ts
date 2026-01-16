export type ActivityRole = 'Participants' | 'Volunteers'

export type Activity = {
  id: string
  title: string
  date: string
  time: string
  location: string
  program: string
  role: ActivityRole
  capacity: number
  seatsLeft: number
  cadence: string
  description: string
}

export type Registration = {
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

export const sampleActivities: Activity[] = [
  {
    id: 'act-01',
    title: 'Morning Movement',
    date: '2024-04-10',
    time: '09:30',
    location: 'Studio A',
    program: 'Movement',
    role: 'Participants',
    capacity: 12,
    seatsLeft: 5,
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
    seatsLeft: 2,
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
    seatsLeft: 1,
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
    seatsLeft: 2,
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
    seatsLeft: 4,
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
    seatsLeft: 8,
    cadence: 'Twice weekly',
    description: 'Midday movement session with adaptive options.',
  },
]

export const sampleRegistrations: Registration[] = [
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
