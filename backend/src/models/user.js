import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    displayName: { type: String, default: '' },
    email: { type: String, default: '', lowercase: true, trim: true },
    phone: { type: String, default: '' },
    passwordHash: { type: String, required: true },
    status: { type: String, default: 'active', index: true },
    department: { type: String, default: '', index: true },
    orgPath: { type: String, default: '' },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
)

userSchema.index({ createdAt: -1 })

export const User =
  mongoose.models.User || mongoose.model('User', userSchema)
