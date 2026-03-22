import mongoose from 'mongoose'

const tagSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, lowercase: true, trim: true },
    color: { type: String, default: '#2458D2' },
  },
  { timestamps: true },
)

export const Tag = mongoose.models.Tag || mongoose.model('Tag', tagSchema)
