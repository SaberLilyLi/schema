import http from './http'
import type {
  ApprovalListData,
  ApiEnvelope,
  ArticleDetailData,
  ArticleListData,
  ArticleVersionItem,
  CreateArticleData,
  WorkflowActionData,
} from '@/types/api'

export interface ArticleListQuery {
  page?: number
  pageSize?: number
  q?: string
  domain?: string
  status?: string
}

export async function fetchArticleList(params: ArticleListQuery) {
  const { data } = await http.post<ApiEnvelope<ArticleListData>>('/articles/query', params)
  return data.data
}

export async function fetchArticleDetail(id: string) {
  const { data } = await http.post<ApiEnvelope<ArticleDetailData>>(`/articles/detail/${id}`)
  return data.data
}

export async function createArticle(payload: {
  title: string
  contentMd: string
  domain?: string
  classification?: string
  articleNo?: string
  changeSummary?: string
  visibilityPolicy?: Record<string, unknown>
}) {
  const { data } = await http.post<ApiEnvelope<CreateArticleData>>('/articles/create', payload)
  return data.data
}

export async function fetchArticleVersions(id: string) {
  const { data } = await http.post<ApiEnvelope<ArticleVersionItem[]>>(
    `/articles/${id}/versions`,
  )
  return data.data
}

export async function submitArticle(id: string) {
  const { data } = await http.post<ApiEnvelope<WorkflowActionData>>(
    `/articles/${id}/submit`,
  )
  return data.data
}

export async function approveArticle(id: string) {
  const { data } = await http.post<ApiEnvelope<WorkflowActionData>>(
    `/articles/${id}/approve`,
  )
  return data.data
}

export async function rejectArticle(id: string, reason: string) {
  const { data } = await http.post<ApiEnvelope<WorkflowActionData>>(
    `/articles/${id}/reject`,
    { reason },
  )
  return data.data
}

export async function publishArticle(id: string) {
  const { data } = await http.post<ApiEnvelope<WorkflowActionData>>(
    `/articles/${id}/publish`,
  )
  return data.data
}

export async function fetchApprovalPending(params: { page?: number; pageSize?: number }) {
  const { data } = await http.post<ApiEnvelope<ApprovalListData>>(
    '/articles/approval/pending',
    params,
  )
  return data.data
}

export async function fetchApprovalInitiated(params: { page?: number; pageSize?: number }) {
  const { data } = await http.post<ApiEnvelope<ApprovalListData>>(
    '/articles/approval/initiated',
    params,
  )
  return data.data
}
