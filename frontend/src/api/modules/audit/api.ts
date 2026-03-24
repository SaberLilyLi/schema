import http from '@/api/http'
import type { ApiEnvelope } from '../common/rsp'
import type { FetchAuditLogsReq } from '@/types/interfaces/audit/req'
import type { AuditLogDetailRsp, AuditLogListRsp } from '@/types/interfaces/audit/rsp'

export async function fetchAuditLogs(params: FetchAuditLogsReq) {
  const { data } = await http.post<ApiEnvelope<AuditLogListRsp>>('/audit/logs', params)
  return data.data
}

export async function fetchAuditLogDetail(id: string) {
  const { data } = await http.post<ApiEnvelope<AuditLogDetailRsp>>(`/audit/logs/${id}`)
  return data.data
}
