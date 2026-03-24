export interface FetchArticleDetailRsp {
  id: string
  articleNo: string
  title: string
  domain: string
  classification: string
  status: string
  visibilityPolicy: Record<string, unknown>
  tags: string[]
  currentVersion: {
    id: string
    versionNo: number
    contentMd: string
    contentHtml: string
    changeSummary: string
    workflowState: string
    submittedAt: string | null
    approvedAt: string | null
    publishedAt: string | null
  } | null
  createdAt: string
  updatedAt: string
}
