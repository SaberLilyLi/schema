/** 统一响应信封（除 GET /api/health） */
export interface ApiEnvelope<T> {
  code: number
  message: string
  requestId: string
  data: T
}

export interface LoginUser {
  id: string
  displayName: string
  username: string
  roles: string[]
  permissions: string[]
}

export interface LoginData {
  accessToken: string
  expiresIn: string
  user: LoginUser
}

export interface MeData {
  id: string
  displayName: string
  username: string
  email: string
  department: string
  orgPath: string
  roles: string[]
  permissions: string[]
}

export interface ArticleListItem {
  id: string
  articleNo: string
  title: string
  domain: string
  classification: string
  status: string
  updatedAt: string
  tags: string[]
}

export interface ArticleListData {
  page: number
  pageSize: number
  total: number
  items: ArticleListItem[]
}

export interface ArticleVersionDetail {
  id: string
  versionNo: number
  contentMd: string
  contentHtml: string
  changeSummary: string
  workflowState: string
  submittedAt: string | null
  approvedAt: string | null
  publishedAt: string | null
}

export interface ArticleDetailData {
  id: string
  articleNo: string
  title: string
  domain: string
  classification: string
  status: string
  visibilityPolicy: Record<string, unknown>
  tags: string[]
  currentVersion: ArticleVersionDetail | null
  createdAt: string
  updatedAt: string
}

export interface CreateArticleData {
  id: string
  articleNo: string
  currentVersionId: string
}
