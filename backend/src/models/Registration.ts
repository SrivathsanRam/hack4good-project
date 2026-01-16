import mongoose, { Document, Schema } from 'mongoose'

export interface IRegistration extends Document {
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
  createdAt: Date
  updatedAt: Date
}

const RegistrationSchema = new Schema<IRegistration>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    activityId: {
      type: String,
      required: true,
      ref: 'Activity',
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    role: {
      type: String,
      required: true,
      enum: ['Participant', 'Volunteer'],
    },
    membership: {
      type: String,
      required: true,
      enum: ['Ad hoc', 'Once a week', 'Twice a week', 'Three or more', 'Weekly'],
    },
    accessibility: {
      type: Boolean,
      default: false,
    },
    caregiverPayment: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      default: '',
    },
    attended: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

// Create indexes for common queries
RegistrationSchema.index({ activityId: 1 })
RegistrationSchema.index({ email: 1 })

export default mongoose.model<IRegistration>('Registration', RegistrationSchema)
