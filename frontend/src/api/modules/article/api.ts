import http from '@/api/http'
import type { ApiEnvelope } from '../common/rsp'
import type {
  CreateArticleReq,
  FetchApprovalListReq,
  FetchArticleListReq,
  SaveArticleEditReq,
} from '@/types/interfaces/article/req'
import type {
  ApprovalListRsp,
  ArticleDetailRsp,
  ArticleEditableRsp,
  ArticleListRsp,
  ArticleVersionItem,
  CreateArticleRsp,
  SaveArticleEditRsp,
  WorkflowActionRsp,
} from '@/types/interfaces/article/rsp'

export async function fetchArticleList(params: FetchArticleListReq) {
  const { data } = await http.post<ApiEnvelope<ArticleListRsp>>('/articles/query', params)
  return data.data
}

export async function fetchArticleDetail(id: string) {
  const { data } = await http.post<ApiEnvelope<ArticleDetailRsp>>(`/articles/detail/${id}`)
  return data.data
}

export async function createArticle(payload: CreateArticleReq) {
  const { data } = await http.post<ApiEnvelope<CreateArticleRsp>>('/articles/create', payload)
  return data.data
}

export async function fetchArticleEditable(id: string) {
  const { data } = await http.post<ApiEnvelope<ArticleEditableRsp>>(`/articles/${id}/editable`)
  return data.data
}

export async function saveArticleEdit(id: string, payload: SaveArticleEditReq) {
  const { data } = await http.post<ApiEnvelope<SaveArticleEditRsp>>(
    `/articles/${id}/save`,
    payload,
  )
  return data.data
}

export async function fetchArticleVersions(id: string) {
  const { data } = await http.post<ApiEnvelope<ArticleVersionItem[]>>(`/articles/${id}/versions`)
  return data.data
}

export async function submitArticle(id: string) {
  const { data } = await http.post<ApiEnvelope<WorkflowActionRsp>>(`/articles/${id}/submit`)
  return data.data
}

export async function approveArticle(id: string) {
  const { data } = await http.post<ApiEnvelope<WorkflowActionRsp>>(`/articles/${id}/approve`)
  return data.data
}

export async function rejectArticle(id: string, reason: string) {
  const { data } = await http.post<ApiEnvelope<WorkflowActionRsp>>(`/articles/${id}/reject`, {
    reason,
  })
  return data.data
}

export async function publishArticle(id: string) {
  const { data } = await http.post<ApiEnvelope<WorkflowActionRsp>>(`/articles/${id}/publish`)
  return data.data
}

export async function fetchApprovalPending(params: FetchApprovalListReq) {
  const { data } = await http.post<ApiEnvelope<ApprovalListRsp>>(
    '/articles/approval/pending',
    params,
  )
  return data.data
}

export async function fetchApprovalInitiated(params: FetchApprovalListReq) {
  const { data } = await http.post<ApiEnvelope<ApprovalListRsp>>(
    '/articles/approval/initiated',
    params,
  )
  return data.data
}

export async function fetchApprovalHistory(params: FetchApprovalListReq) {
  const { data } = await http.post<ApiEnvelope<ApprovalListRsp>>(
    '/articles/approval/history',
    params,
  )
  return data.data
}
