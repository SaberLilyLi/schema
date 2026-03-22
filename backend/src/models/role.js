import mongoose from 'mongoose'

const roleSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
  },
  { timestamps: true },
)

export const Role =
  mongoose.models.Role || mongoose.model('Role', roleSchema)
