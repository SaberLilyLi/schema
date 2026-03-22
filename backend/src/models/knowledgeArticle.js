import mongoose from 'mongoose'

const knowledgeArticleSchema = new mongoose.Schema(
  {
    articleNo: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, index: true },
    domain: { type: String, default: '', index: true },
    classification: { type: String, default: 'internal', index: true },
    status: { type: String, default: 'draft', index: true },
    currentVersionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ArticleVersion',
      default: null,
    },
    /** ABAC 可见策略（对应 PostgreSQL jsonb） */
    visibilityPolicy: { type: mongoose.Schema.Types.Mixed, default: {} },
    /** 用于检索：标题+正文摘要（对应 search_tsv 的简化实现） */
    searchText: { type: String, default: '' },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true },
)

knowledgeArticleSchema.index({ updatedAt: -1 })
knowledgeArticleSchema.index({ title: 'text', searchText: 'text', articleNo: 'text' })

export const KnowledgeArticle =
  mongoose.models.KnowledgeArticle ||
  mongoose.model('KnowledgeArticle', knowledgeArticleSchema)
