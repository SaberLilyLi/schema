export type { ApprovalListItem } from '../fetchApprovalPending/rsp'

export interface FetchApprovalHistoryRsp {
  page: number
  pageSize: number
  total: number
  items: import('../fetchApprovalPending/rsp').ApprovalListItem[]
}
