import mongoose, { Document, Schema } from 'mongoose'
import bcrypt from 'bcryptjs'

export interface IUser extends Document {
  id: string
  email: string
  password: string
  name: string
  role: 'participant' | 'volunteer' | 'staff'
  // Participant-specific fields
  membership?: 'Ad hoc' | 'Weekly' | 'Twice weekly' | 'Three or more'
  preferences?: string[]
  disabilities?: string
  mobilityStatus?: 'can walk' | 'cannot walk' | 'cannot walk long distances'
  onboardingComplete: boolean
  createdAt: Date
  updatedAt: Date
  comparePassword(candidatePassword: string): Promise<boolean>
}

const UserSchema = new Schema<IUser>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      enum: ['participant', 'volunteer', 'staff'],
    },
    // Participant-specific fields
    membership: {
      type: String,
      enum: ['Ad hoc', 'Weekly', 'Twice weekly', 'Three or more'],
    },
    preferences: {
      type: [String],
      default: [],
    },
    disabilities: {
      type: String,
      default: '',
    },
    mobilityStatus: {
      type: String,
      enum: ['can walk', 'cannot walk', 'cannot walk long distances'],
    },
    onboardingComplete: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

// Hash password before saving
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return
  
  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
  } catch (error: any) {
    throw error
  }
})

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password)
}

// Create indexes
UserSchema.index({ email: 1 })
UserSchema.index({ role: 1 })

export default mongoose.model<IUser>('User', UserSchema)
