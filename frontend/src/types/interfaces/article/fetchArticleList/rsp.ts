export interface ArticleListItem {
  id: string
  articleNo: string
  title: string
  domain: string
  classification: string
  status: string
  workflowState?: string | null
  updatedAt: string
  tags: string[]
}

export interface FetchArticleListRsp {
  page: number
  pageSize: number
  total: number
  items: ArticleListItem[]
}
