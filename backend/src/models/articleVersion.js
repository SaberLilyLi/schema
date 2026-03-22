import mongoose from 'mongoose'

const articleVersionSchema = new mongoose.Schema(
  {
    articleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'KnowledgeArticle',
      required: true,
      index: true,
    },
    versionNo: { type: Number, required: true },
    contentMd: { type: String, required: true },
    contentHtml: { type: String, default: '' },
    changeSummary: { type: String, default: '' },
    workflowState: { type: String, default: 'draft', index: true },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    submittedAt: { type: Date },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    publishedAt: { type: Date },
  },
  { timestamps: false },
)

articleVersionSchema.index({ articleId: 1, versionNo: 1 }, { unique: true })

export const ArticleVersion =
  mongoose.models.ArticleVersion ||
  mongoose.model('ArticleVersion', articleVersionSchema)
