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
  workflowState?: string | null
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

export interface ArticleVersionItem {
  id: string
  versionNo: number
  workflowState: string
  changeSummary: string
  submittedAt: string | null
  approvedAt: string | null
  publishedAt: string | null
}

export interface WorkflowActionData {
  articleId: string
  status: string
  workflowState: string
}

export interface ArticleEditableData {
  articleId: string
  articleNo: string
  title: string
  domain: string
  classification: string
  visibilityPolicy: Record<string, unknown>
  tags: string[]
  currentVersion: {
    id: string
    versionNo: number
    changeSummary: string
    contentMd: string
    workflowState: string
  }
  editPolicy: {
    mode: 'update_current' | 'new_version' | 'readonly'
    reason: string
  }
}

export interface ArticleSaveData {
  articleId: string
  articleNo: string
  status: string
  currentVersionId: string
  versionNo: number
  mode: 'update_current' | 'new_version'
}

export interface ApprovalListItem {
  id: string
  articleNo: string
  title: string
  domain: string
  classification: string
  status: string
  workflowState: string
  versionNo: number
  submittedAt: string | null
  approvedAt?: string | null
  publishedAt?: string | null
  approverName?: string | null
  updatedAt: string
}

export interface ApprovalListData {
  page: number
  pageSize: number
  total: number
  items: ApprovalListItem[]
}

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

export interface AuditLogListData {
  page: number
  pageSize: number
  total: number
  items: AuditLogListItem[]
}

export interface AuditLogDetailData {
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

export interface TagItem {
  id: string
  name: string
  color: string
  meaning: string
  visibleRoleCodes: string[]
  createdAt: string
  updatedAt: string
}

export interface TagListData {
  page: number
  pageSize: number
  total: number
  items: TagItem[]
}

export interface TagRoleItem {
  code: string
  name: string
}
