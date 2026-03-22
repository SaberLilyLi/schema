import http from './http'
import type {
  ApiEnvelope,
  ArticleDetailData,
  ArticleListData,
  CreateArticleData,
} from '@/types/api'

export interface ArticleListQuery {
  page?: number
  pageSize?: number
  q?: string
  domain?: string
  status?: string
}

export async function fetchArticleList(params: ArticleListQuery) {
  const { data } = await http.get<ApiEnvelope<ArticleListData>>('/articles', {
    params,
  })
  return data.data
}

export async function fetchArticleDetail(id: string) {
  const { data } = await http.get<ApiEnvelope<ArticleDetailData>>(`/articles/${id}`)
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
  const { data } = await http.post<ApiEnvelope<CreateArticleData>>('/articles', payload)
  return data.data
}
