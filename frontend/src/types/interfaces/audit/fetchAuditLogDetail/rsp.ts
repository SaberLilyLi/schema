export interface FetchAuditLogDetailRsp {
  id: string
  seq: number
  occurredAt: string
  action: string
  actorUserId: string | null
  actorUsername: string
  resourceType: string
  resourceId: string
  ip: string
  userAgent: string
  requestId: string
  statusCode: number | null
  success: boolean
  details: Record<string, unknown>
  prevHash: string
  recordHash: string
}
