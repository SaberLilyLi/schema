export interface SaveArticleEditReq {
  title: string
  contentMd: string
  domain?: string
  classification?: string
  tags?: string[]
  changeSummary?: string
  visibilityPolicy?: Record<string, unknown>
}
