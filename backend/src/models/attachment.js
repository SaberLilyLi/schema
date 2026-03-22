import mongoose from 'mongoose'

const attachmentSchema = new mongoose.Schema(
  {
    articleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'KnowledgeArticle',
      required: true,
      index: true,
    },
    versionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ArticleVersion',
      index: true,
    },
    filename: { type: String, required: true },
    mimeType: { type: String, default: '', index: true },
    sizeBytes: { type: Number, default: 0 },
    storageProvider: { type: String, default: 'object_storage' },
    storageKey: { type: String, sparse: true, unique: true },
    sha256: { type: String, default: '', index: true },
    downloadPolicy: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true },
)

attachmentSchema.index({ createdAt: -1 })

export const Attachment =
  mongoose.models.Attachment || mongoose.model('Attachment', attachmentSchema)
