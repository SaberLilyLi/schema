<script setup lang="ts">
import { computed } from 'vue'
import type { TableColumnCtx } from 'element-plus'
import type {
  CommonActionColumn,
  CommonTableActionEvent,
  CommonTableColumn,
  CommonPaginationConfig,
} from './types'

type RowData = Record<string, unknown>

const props = withDefaults(
  defineProps<{
    data: RowData[]
    columns: CommonTableColumn<RowData>[]
    loading?: boolean
    rowKey?: string | ((row: RowData) => string | number)
    rowClassName?: ((arg: { row: RowData; rowIndex: number }) => string) | string
    stripe?: boolean
    border?: boolean
    size?: 'large' | 'default' | 'small'
    height?: string | number
    maxHeight?: string | number
    pagination?: CommonPaginationConfig
    actionColumn?: CommonActionColumn<RowData>
    showPagination?: boolean
  }>(),
  {
    loading: false,
    stripe: true,
    border: false,
    size: 'default',
    rowKey: 'id',
    showPagination: true,
  },
)

const emit = defineEmits<{
  (e: 'row-click', row: RowData, column: TableColumnCtx<RowData>, event: Event): void
  (e: 'selection-change', rows: RowData[]): void
  (e: 'page-change', page: number): void
  (e: 'size-change', size: number): void
  (e: 'action', payload: CommonTableActionEvent<RowData>): void
}>()

const pager = computed(() => ({
  enabled: props.showPagination && (props.pagination?.enabled ?? true),
  currentPage: props.pagination?.currentPage ?? 1,
  pageSize: props.pagination?.pageSize ?? 20,
  total: props.pagination?.total ?? 0,
  pageSizes: props.pagination?.pageSizes ?? [10, 20, 50, 100],
  layout: props.pagination?.layout ?? 'total, sizes, prev, pager, next, jumper',
  background: props.pagination?.background ?? true,
}))

function getValue(row: RowData, prop?: string) {
  if (!prop) return undefined
  return row[prop]
}

function renderCell(
  row: RowData,
  column: CommonTableColumn<RowData>,
  tableColumn: TableColumnCtx<RowData>,
  index: number,
) {
  if (column.formatter) {
    return column.formatter(row, tableColumn, getValue(row, column.prop as string), index)
  }
  return getValue(row, column.prop as string)
}

function isVisible(visible: CommonActionColumn<RowData>['buttons'][number]['visible'], row: RowData, index: number) {
  if (typeof visible === 'function') return visible(row, index)
  return visible ?? true
}

function isDisabled(
  disabled: CommonActionColumn<RowData>['buttons'][number]['disabled'],
  row: RowData,
  index: number,
) {
  if (typeof disabled === 'function') return disabled(row, index)
  return disabled ?? false
}

function triggerAction(key: string, row: RowData, index: number) {
  emit('action', { key, row, index })
}

function handleRowClick(row: RowData, column: TableColumnCtx<RowData>, event: Event) {
  emit('row-click', row, column, event)
}

function handleSelectionChange(rows: RowData[]) {
  emit('selection-change', rows)
}

function handlePageChange(value: number) {
  emit('page-change', value)
}

function handleSizeChange(value: number) {
  emit('size-change', value)
}
</script>

<template>
  <div class="common-table">
    <el-table
      v-loading="loading"
      :data="data"
      :row-key="rowKey"
      :row-class-name="rowClassName"
      :stripe="stripe"
      :border="border"
      :size="size"
      :height="height"
      :max-height="maxHeight"
      style="width: 100%"
      @row-click="handleRowClick"
      @selection-change="handleSelectionChange"
    >
      <el-table-column
        v-for="column in columns"
        :key="column.key"
        :type="column.type === 'default' ? undefined : column.type"
        :prop="typeof column.prop === 'string' ? column.prop : undefined"
        :label="column.label"
        :width="column.width"
        :min-width="column.minWidth"
        :align="column.align"
        :header-align="column.headerAlign"
        :fixed="column.fixed"
        :sortable="column.sortable"
        :show-overflow-tooltip="column.showOverflowTooltip"
        :class-name="column.className"
        :label-class-name="column.headerClassName"
      >
        <template #default="{ row, column: tableColumn, $index }">
          <slot
            v-if="column.slotName"
            :name="column.slotName"
            :row="row"
            :column="column"
            :index="$index"
          />
          <template v-else>
            {{ renderCell(row, column, tableColumn, $index) }}
          </template>
        </template>
      </el-table-column>

      <el-table-column
        v-if="actionColumn?.buttons?.length"
        :label="actionColumn.label ?? '操作'"
        :width="actionColumn.width"
        :min-width="actionColumn.minWidth ?? 140"
        :fixed="actionColumn.fixed"
        :align="actionColumn.align ?? 'left'"
        :header-align="actionColumn.headerAlign ?? 'left'"
      >
        <template #default="{ row, $index }">
          <div class="common-table__actions">
            <span v-for="button in actionColumn.buttons" :key="button.key">
              <template v-if="isVisible(button.visible, row, $index)">
                <el-popconfirm
                  v-if="button.confirmText"
                  :title="button.confirmText"
                  @confirm="triggerAction(button.key, row, $index)"
                >
                  <template #reference>
                    <el-button
                      :type="button.type"
                      :link="button.link ?? true"
                      :size="button.size ?? 'small'"
                      :plain="button.plain ?? false"
                      :disabled="isDisabled(button.disabled, row, $index)"
                    >
                      {{ button.text }}
                    </el-button>
                  </template>
                </el-popconfirm>

                <el-button
                  v-else
                  :type="button.type"
                  :link="button.link ?? true"
                  :size="button.size ?? 'small'"
                  :plain="button.plain ?? false"
                  :disabled="isDisabled(button.disabled, row, $index)"
                  @click="triggerAction(button.key, row, $index)"
                >
                  {{ button.text }}
                </el-button>
              </template>
            </span>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <div
      v-if="pager.enabled"
      class="common-table__pager"
    >
      <el-pagination
        :current-page="pager.currentPage"
        :page-size="pager.pageSize"
        :total="pager.total"
        :page-sizes="pager.pageSizes"
        :layout="pager.layout"
        :background="pager.background"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.common-table__pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.common-table__actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-wrap: wrap;
}
</style>
