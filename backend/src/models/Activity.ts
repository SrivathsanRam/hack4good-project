import mongoose, { Document, Schema } from 'mongoose'

export interface IActivity extends Document {
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
    time: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    program: {
      type: String,
      required: true,
      enum: ['Movement', 'Creative', 'Caregiver sessions'],
    },
    role: {
      type: String,
      required: true,
      enum: ['Participants', 'Volunteers'],
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    seatsLeft: {
      type: Number,
      required: true,
      min: 0,
    },
    cadence: {
      type: String,
      required: true,
      enum: ['Ad hoc', 'Weekly', 'Twice weekly'],
    },
    description: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
)

// Create index for common queries
ActivitySchema.index({ program: 1 })
ActivitySchema.index({ role: 1 })
ActivitySchema.index({ date: 1 })

export default mongoose.model<IActivity>('Activity', ActivitySchema)
