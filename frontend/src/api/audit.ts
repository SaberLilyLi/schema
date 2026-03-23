import http from './http'
import type {
  ApiEnvelope,
  AuditLogDetailData,
  AuditLogListData,
} from '@/types/api'

export interface FetchAuditLogsParams {
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

export async function fetchAuditLogs(params: FetchAuditLogsParams) {
  const { data } = await http.post<ApiEnvelope<AuditLogListData>>('/audit/logs', params)
  return data.data
}

export async function fetchAuditLogDetail(id: string) {
  const { data } = await http.post<ApiEnvelope<AuditLogDetailData>>(`/audit/logs/${id}`)
  return data.data
}
