/** 知识条目状态（knowledge_articles.status） */
export const ARTICLE_STATUS = {
  DRAFT: 'draft',
  IN_REVIEW: 'in_review',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
}

/** 版本流程（article_versions.workflow_state） */
export const WORKFLOW_STATE = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  REVIEWED: 'reviewed',
  APPROVED: 'approved',
  PUBLISHED: 'published',
  REJECTED: 'rejected',
}

/** 密级 */
export const CLASSIFICATION = {
  INTERNAL: 'internal',
  CONFIDENTIAL: 'confidential',
  SECRET: 'secret',
}

/** 用户状态 */
export const USER_STATUS = {
  ACTIVE: 'active',
  DISABLED: 'disabled',
  LOCKED: 'locked',
}
