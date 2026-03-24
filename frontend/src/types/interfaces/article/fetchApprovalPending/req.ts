export interface FetchApprovalPendingReq {
  page?: number
  pageSize?: number
  q?: string
  domain?: string
  workflowState?: string
  approver?: string
}
