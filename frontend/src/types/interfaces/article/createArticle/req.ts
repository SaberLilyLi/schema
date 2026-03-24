export interface CreateArticleReq {
  title: string
  contentMd: string
  domain?: string
  classification?: string
  tags?: string[]
  articleNo?: string
  changeSummary?: string
  visibilityPolicy?: Record<string, unknown>
}
