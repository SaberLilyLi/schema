export interface ArticleVersionItem {
  id: string
  versionNo: number
  workflowState: string
  changeSummary: string
  submittedAt: string | null
  approvedAt: string | null
  publishedAt: string | null
}

export type FetchArticleVersionsRsp = ArticleVersionItem[]
