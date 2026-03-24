export interface AuditLogListItem {
  id: string
  seq: number
  occurredAt: string
  action: string
  actorUsername: string
  resourceType: string
  resourceId: string
  success: boolean
  statusCode: number | null
  requestId: string
}

export interface FetchAuditLogsRsp {
  page: number
  pageSize: number
  total: number
  items: AuditLogListItem[]
}
