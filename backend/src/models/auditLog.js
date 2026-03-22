import mongoose from 'mongoose'

const auditLogSchema = new mongoose.Schema(
  {
    seq: { type: Number, required: true, unique: true, index: true },
    requestId: { type: String, index: true },
    actorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    actorUsername: { type: String, default: '' },
    action: { type: String, required: true, index: true },
    resourceType: { type: String, default: '', index: true },
    resourceId: { type: String, default: '' },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    statusCode: { type: Number },
    success: { type: Boolean, default: true, index: true },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    prevHash: { type: String, default: '' },
    recordHash: { type: String, required: true, index: true },
  },
  { timestamps: true },
)

auditLogSchema.index({ createdAt: -1 })

export const AuditLog =
  mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema)
