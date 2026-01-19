import mongoose, { Document, Schema } from 'mongoose'

export interface IActivity extends Document {
  id: string
  title: string
  date: string
  startTime: string
  endTime: string
  location: string
  address: string
  coordinates: {
    lat: number
    lng: number
  }
  program: string
  roles: string[] // ['Participant', 'Volunteer', 'Volunteers Only']
  participantCapacity: number
  volunteerCapacity: number
  participantSeatsLeft: number
  volunteerSeatsLeft: number
  type: string // renamed from cadence
  description: string
  imageUrl: string
  wheelchairAccessible: boolean
  paymentRequired: boolean
  paymentAmount?: number
  staffPresent: string[] // Array of staff user IDs
  contactIC: string // Single staff user ID
  featured: boolean // Whether this activity is featured on homepage
  createdAt: Date
  updatedAt: Date
}

const ActivitySchema = new Schema<IActivity>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: String,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      default: '',
      trim: true,
    },
    coordinates: {
      lat: {
        type: Number,
        default: 1.3521,
      },
      lng: {
        type: Number,
        default: 103.8198,
      },
    },
    program: {
      type: String,
      required: true,
      enum: ['Movement', 'Creative', 'Caregiver sessions'],
    },
    roles: {
      type: [String],
      required: true,
      default: ['Participant'],
    },
    participantCapacity: {
      type: Number,
      default: 0,
      min: 0,
    },
    volunteerCapacity: {
      type: Number,
      default: 0,
      min: 0,
    },
    participantSeatsLeft: {
      type: Number,
      default: 0,
      min: 0,
    },
    volunteerSeatsLeft: {
      type: Number,
      default: 0,
      min: 0,
    },
    type: {
      type: String,
      required: true,
      enum: ['Weekly', 'Fortnightly', 'Monthly', 'One-off'],
      default: 'One-off',
    },
    description: {
      type: String,
      default: '',
    },
    imageUrl: {
      type: String,
      default: '',
    },
    wheelchairAccessible: {
      type: Boolean,
      required: true,
      default: false,
    },
    paymentRequired: {
      type: Boolean,
      required: true,
      default: false,
    },
    paymentAmount: {
      type: Number,
      min: 0,
      required: function(this: IActivity) {
        return this.paymentRequired;
      },
    },
    staffPresent: {
      type: [String],
      default: [],
    },
    contactIC: {
      type: String,
      default: '',
    },
    featured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

// Create index for common queries
ActivitySchema.index({ program: 1 })
ActivitySchema.index({ roles: 1 })
ActivitySchema.index({ date: 1 })

export default mongoose.model<IActivity>('Activity', ActivitySchema)
