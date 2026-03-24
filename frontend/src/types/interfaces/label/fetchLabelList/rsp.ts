export interface LabelItem {
  id: string
  name: string
  color: string
  meaning: string
  visibleRoleCodes: string[]
  createdAt: string
  updatedAt: string
}

export interface FetchLabelListRsp {
  page: number
  pageSize: number
  total: number
  items: LabelItem[]
}
