export interface FetchApprovalHistoryReq {
  page?: number
  pageSize?: number
  q?: string
  domain?: string
  workflowState?: string
  approver?: string
}
