import http from '@/api/http'
import type { ApiEnvelope } from '../common/rsp'
import type {
  CreateLabelReq,
  FetchLabelListReq,
  UpdateLabelReq,
} from '@/types/interfaces/label/req'
import type {
  LabelListRsp,
  LabelOptionItem,
  LabelRoleItem,
  LabelSaveRsp,
} from '@/types/interfaces/label/rsp'

export async function fetchLabelList(params: FetchLabelListReq) {
  const { data } = await http.post<ApiEnvelope<LabelListRsp>>('/tags/query', params)
  return data.data
}

export async function createLabel(payload: CreateLabelReq) {
  const { data } = await http.post<ApiEnvelope<LabelSaveRsp>>('/tags/create', payload)
  return data.data
}

export async function updateLabel(id: string, payload: UpdateLabelReq) {
  const { data } = await http.post<ApiEnvelope<LabelSaveRsp>>(`/tags/${id}/update`, payload)
  return data.data
}

export async function fetchLabelRoles() {
  const { data } = await http.post<ApiEnvelope<LabelRoleItem[]>>('/tags/roles')
  return data.data
}

export async function fetchVisibleLabelOptions() {
  const { data } = await http.post<ApiEnvelope<LabelOptionItem[]>>('/tags/options')
  return data.data
}
