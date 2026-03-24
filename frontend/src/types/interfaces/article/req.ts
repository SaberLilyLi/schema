export type { FetchArticleListReq } from './fetchArticleList/req'
export type { CreateArticleReq } from './createArticle/req'
export type { SaveArticleEditReq } from './saveArticleEdit/req'
export type { FetchApprovalPendingReq } from './fetchApprovalPending/req'
export type { FetchApprovalInitiatedReq } from './fetchApprovalInitiated/req'
export type { FetchApprovalHistoryReq } from './fetchApprovalHistory/req'

// Compatibility alias used by current API implementation.
export type FetchApprovalListReq = import('./fetchApprovalPending/req').FetchApprovalPendingReq
