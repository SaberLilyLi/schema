export interface SaveArticleEditRsp {
  articleId: string
  articleNo: string
  status: string
  currentVersionId: string
  versionNo: number
  mode: 'update_current' | 'new_version'
}
