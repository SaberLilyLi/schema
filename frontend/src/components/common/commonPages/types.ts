import type { SearchItemConfig } from '@/components/common/commonSearch/types'
import type {
  CommonActionColumn,
  CommonPaginationConfig,
  CommonTableColumn,
} from '@/components/common/commonTable/types'

export interface CommonPagesToolbarButton {
  key: string
  text: string
  type?: '' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
  plain?: boolean
  link?: boolean
  disabled?: boolean
}

export interface CommonPagesConfig {
  title: string
  tableTitle?: string
  searchItems: SearchItemConfig[]
  searchModest: Record<string, unknown>
  tableColumns: CommonTableColumn[]
  tableData: Record<string, unknown>[]
  loading?: boolean
  pagination?: CommonPaginationConfig
  actionColumn?: CommonActionColumn
  toolbarButtons?: CommonPagesToolbarButton[]
}
