export type { ArticleListItem, FetchArticleListRsp as ArticleListRsp } from './fetchArticleList/rsp'
export type { FetchArticleDetailRsp as ArticleDetailRsp } from './fetchArticleDetail/rsp'
export type { CreateArticleRsp } from './createArticle/rsp'
export type { FetchArticleEditableRsp as ArticleEditableRsp } from './fetchArticleEditable/rsp'
export type { SaveArticleEditRsp } from './saveArticleEdit/rsp'
export type { ArticleVersionItem, FetchArticleVersionsRsp } from './fetchArticleVersions/rsp'
export type { SubmitArticleRsp } from './submitArticle/rsp'
export type { ApproveArticleRsp } from './approveArticle/rsp'
export type { RejectArticleRsp } from './rejectArticle/rsp'
export type { PublishArticleRsp } from './publishArticle/rsp'
export type { ApprovalListItem, FetchApprovalPendingRsp as ApprovalListRsp } from './fetchApprovalPending/rsp'

// Compatibility alias used by current API implementation.
export type WorkflowActionRsp = import('./submitArticle/rsp').SubmitArticleRsp
