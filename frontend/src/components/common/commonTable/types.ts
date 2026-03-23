import type { VNodeChild } from 'vue'
import type { TableColumnCtx } from 'element-plus'

export type TableAlign = 'left' | 'center' | 'right'
export type TableColumnType = 'default' | 'index' | 'selection' | 'expand'
export type ActionButtonType = '' | 'primary' | 'success' | 'warning' | 'danger' | 'info'

export interface CommonPaginationConfig {
  enabled?: boolean
  currentPage: number
  pageSize: number
  total: number
  pageSizes?: number[]
  layout?: string
  background?: boolean
}

export interface CommonTableColumn<Row extends object = Record<string, unknown>> {
  key: string
  label?: string
  type?: TableColumnType
  prop?: keyof Row | string
  width?: number | string
  minWidth?: number | string
  align?: TableAlign
  headerAlign?: TableAlign
  fixed?: boolean | 'left' | 'right'
  sortable?: boolean | 'custom'
  showOverflowTooltip?: boolean
  className?: string
  headerClassName?: string
  formatter?: (
    row: Row,
    column: TableColumnCtx<Row>,
    cellValue: unknown,
    index: number,
  ) => string | number
  slotName?: string
}

export interface CommonActionButton<Row extends object = Record<string, unknown>> {
  key: string
  text: string
  type?: ActionButtonType
  link?: boolean
  size?: 'large' | 'default' | 'small'
  plain?: boolean
  visible?: boolean | ((row: Row, index: number) => boolean)
  disabled?: boolean | ((row: Row, index: number) => boolean)
  confirmText?: string
}

export interface CommonActionColumn<Row extends object = Record<string, unknown>> {
  label?: string
  width?: number | string
  minWidth?: number | string
  fixed?: boolean | 'left' | 'right'
  align?: TableAlign
  headerAlign?: TableAlign
  buttons: CommonActionButton<Row>[]
}

export interface CommonTableActionEvent<Row extends object = Record<string, unknown>> {
  key: string
  row: Row
  index: number
}

export type CommonTableCellSlot<Row extends object = Record<string, unknown>> = (args: {
  row: Row
  index: number
  column: CommonTableColumn<Row>
}) => VNodeChild
