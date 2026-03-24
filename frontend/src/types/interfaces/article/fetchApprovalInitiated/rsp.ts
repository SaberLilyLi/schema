export type { ApprovalListItem } from '../fetchApprovalPending/rsp'

export interface FetchApprovalInitiatedRsp {
  page: number
  pageSize: number
  total: number
  items: import('../fetchApprovalPending/rsp').ApprovalListItem[]
}
