export interface FetchArticleEditableRsp {
  articleId: string
  articleNo: string
  title: string
  domain: string
  classification: string
  visibilityPolicy: Record<string, unknown>
  tags: string[]
  currentVersion: {
    id: string
    versionNo: number
    changeSummary: string
    contentMd: string
    workflowState: string
  }
  editPolicy: {
    mode: 'update_current' | 'new_version' | 'readonly'
    reason: string
  }
}
