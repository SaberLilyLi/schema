import mongoose from 'mongoose'

const articleTagSchema = new mongoose.Schema(
  {
    articleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'KnowledgeArticle',
      required: true,
      index: true,
    },
    tagId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tag',
      required: true,
      index: true,
    },
  },
  { timestamps: false },
)

articleTagSchema.index({ articleId: 1, tagId: 1 }, { unique: true })

export const ArticleTag =
  mongoose.models.ArticleTag || mongoose.model('ArticleTag', articleTagSchema)
