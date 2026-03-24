export interface FetchAuditLogsReq {
  page?: number
  pageSize?: number
  actor?: string
  action?: string
  resourceType?: string
  requestId?: string
  success?: '' | 'true' | 'false'
  startAt?: string
  endAt?: string
}
