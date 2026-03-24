export interface ApprovalListItem {
  id: string
  articleNo: string
  title: string
  domain: string
  classification: string
  status: string
  workflowState: string
  versionNo: number
  submittedAt: string | null
  approvedAt?: string | null
  publishedAt?: string | null
  approverName?: string | null
  updatedAt: string
}

export interface FetchApprovalPendingRsp {
  page: number
  pageSize: number
  total: number
  items: ApprovalListItem[]
}
