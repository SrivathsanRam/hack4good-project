import mongoose, { Document, Schema } from 'mongoose'

export interface INotification extends Document {
  id: string
  title: string
  message: string
  type: 'reminder' | 'signup_request' | 'announcement'
  targetAudience: 'all' | 'participants' | 'volunteers' | 'experienced_volunteers'
  activityId?: string // Optional - for signup requests linked to a specific activity
  createdBy: string // Staff user ID
  createdAt: Date
  expiresAt?: Date
  read: string[] // Array of user IDs who have read this notification
}

const NotificationSchema = new Schema<INotification>(
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
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['reminder', 'signup_request', 'announcement'],
    },
    targetAudience: {
      type: String,
      required: true,
      enum: ['all', 'participants', 'volunteers', 'experienced_volunteers'],
    },
    activityId: {
      type: String,
    },
    createdBy: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
    },
    read: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
)

// Create indexes
NotificationSchema.index({ targetAudience: 1 })
NotificationSchema.index({ createdAt: -1 })
NotificationSchema.index({ expiresAt: 1 })

export default mongoose.model<INotification>('Notification', NotificationSchema)
