<script setup lang="ts">
import { computed } from 'vue'
import CommonSearch from '@/components/common/commonSearch/CommonSearch.vue'
import CommonTable from '@/components/common/commonTable/CommonTable.vue'
import type { CommonPagesToolbarButton } from './types'
import type { SearchItemConfig } from '@/components/common/commonSearch/types'
import type {
  CommonActionColumn,
  CommonPaginationConfig,
  CommonTableActionEvent,
  CommonTableColumn,
} from '@/components/common/commonTable/types'

const props = withDefaults(
  defineProps<{
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
    viewportOffset?: number
    tableFixedHeight?: number | string
  }>(),
  {
    loading: false,
    viewportOffset: 120,
  },
)

const emit = defineEmits<{
  (e: 'update:searchModest', value: Record<string, unknown>): void
  (e: 'search'): void
  (e: 'reset'): void
  (e: 'search-change', payload: { key: string; value: unknown; model: Record<string, unknown> }): void
  (e: 'row-click', row: Record<string, unknown>, column: unknown, event: Event): void
  (e: 'selection-change', rows: Record<string, unknown>[]): void
  (e: 'page-change', page: number): void
  (e: 'size-change', size: number): void
  (e: 'table-action', payload: CommonTableActionEvent): void
  (e: 'toolbar-action', key: string): void
}>()

const resolvedTableTitle = computed(() => props.tableTitle || props.title)
const bodyHeightStyle = computed(() => ({
  height: `calc(100vh - ${props.viewportOffset}px - 46px)`,
}))
const tableHeight = computed(() =>
  props.tableFixedHeight
    ? typeof props.tableFixedHeight === 'number'
      ? `${props.tableFixedHeight}px`
      : props.tableFixedHeight
    : `calc((100vh - ${props.viewportOffset}px - 46px) * 0.7 - 130px)`,
)

function onToolbarClick(button: CommonPagesToolbarButton) {
  if (!button.disabled) {
    emit('toolbar-action', button.key)
  }
}
</script>

<template>
  <section class="common-pages">
    <header class="common-pages__head">
      <h2 class="common-pages__title">{{ title }}</h2>
    </header>

    <div class="common-pages__body" :style="bodyHeightStyle">
      <div class="common-pages__search-panel">
        <CommonSearch
          :search-items="searchItems"
          :search-modest="searchModest"
          @update:search-modest="(value) => emit('update:searchModest', value)"
          @search="emit('search')"
          @reset="emit('reset')"
          @change="(payload) => emit('search-change', payload)"
        >
          <template
            v-for="(_, slotName) in $slots"
            #[slotName]="scope"
          >
            <slot :name="slotName" v-bind="scope" />
          </template>
        </CommonSearch>
      </div>

      <section class="common-pages__table-panel">
        <div class="common-pages__content-head">
          <div class="common-pages__content-title-wrap">
            <span class="common-pages__dot" />
            <span class="common-pages__content-title">{{ resolvedTableTitle }}</span>
          </div>

          <div class="common-pages__toolbar">
            <slot name="toolbar-prefix" />
            <el-button
              v-for="button in toolbarButtons || []"
              :key="button.key"
              :type="button.type"
              :plain="button.plain ?? false"
              :link="button.link ?? false"
              :disabled="button.disabled ?? false"
              @click="onToolbarClick(button)"
            >
              {{ button.text }}
            </el-button>
            <slot name="toolbar-suffix" />
          </div>
        </div>

        <CommonTable
          :data="tableData"
          :columns="tableColumns"
          :loading="loading"
          :height="tableHeight"
          :pagination="pagination"
          :action-column="actionColumn"
          @row-click="(row, column, event) => emit('row-click', row, column, event)"
          @selection-change="(rows) => emit('selection-change', rows)"
          @page-change="(page) => emit('page-change', page)"
          @size-change="(size) => emit('size-change', size)"
          @action="(payload) => emit('table-action', payload)"
        >
          <template
            v-for="(_, slotName) in $slots"
            #[slotName]="scope"
          >
            <slot :name="slotName" v-bind="scope" />
          </template>
        </CommonTable>
      </section>
    </div>
  </section>
</template>

<style scoped lang="scss">
.common-pages__head {
  margin-bottom: 12px;
}

.common-pages {
  margin-bottom: 12px;
}

.common-pages__title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}

.common-pages__body {
  display: grid;
  grid-template-rows: 30% 70%;
  gap: 12px;
  min-height: 0;
}

.common-pages__search-panel {
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-bg-color-overlay);
  overflow: hidden;
}

.common-pages__table-panel {
  padding: 10px 14px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-bg-color-overlay);
  overflow: visible;
}

.common-pages__content-head {
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px dashed var(--el-border-color-lighter);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.common-pages__content-title-wrap {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.common-pages__dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: var(--el-color-primary);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--el-color-primary) 14%, transparent);
}

.common-pages__content-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.common-pages__toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.common-pages__toolbar :deep(.el-button) {
  min-width: 72px;
}

@media (max-width: 1280px) {
  .common-pages__body {
    grid-template-rows: auto auto;
    height: auto !important;
  }

  .common-pages__search-panel,
  .common-pages__table-panel {
    overflow: visible;
  }
}
</style>
