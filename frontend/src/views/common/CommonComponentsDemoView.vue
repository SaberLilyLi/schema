<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import CommonPages from '@/components/common/commonPages/CommonPages.vue'
import {
  commonPagesDefaultSearchModest,
  commonPagesDemoRows,
  commonPagesSearchItems,
  commonPagesTableColumns,
  type CommonPagesDemoRow,
} from './common-pages-demo.config'

const allRows = ref<CommonPagesDemoRow[]>([...commonPagesDemoRows])
const rows = ref<CommonPagesDemoRow[]>([...commonPagesDemoRows])
const loading = ref(false)

const pager = ref({
  page: 1,
  pageSize: 10,
  total: commonPagesDemoRows.length,
})

const searchModest = ref<Record<string, unknown>>({
  ...commonPagesDefaultSearchModest,
})

function applyFilter() {
  const keyword = String(searchModest.value.keyword || '').trim().toLowerCase()
  const category = String(searchModest.value.category || '').trim()
  const status = String(searchModest.value.status || '').trim()
  const includeDraft = Boolean(searchModest.value.includeDraft)

  rows.value = allRows.value.filter((row) => {
    if (keyword && !row.name.toLowerCase().includes(keyword)) return false
    if (category && row.category !== category) return false
    if (status && row.status !== status) return false
    if (!includeDraft && row.status === 'draft') return false
    return true
  })

  pager.value.page = 1
  pager.value.total = rows.value.length
}

function onSearch() {
  loading.value = true
  setTimeout(() => {
    applyFilter()
    loading.value = false
  }, 200)
}

function onAction(payload: { key: string; row: Record<string, unknown> }) {
  ElMessage.info(`触发动作：${payload.key}（${payload.row.name as string}）`)
}

function onSearchModelUpdate(value: Record<string, unknown>) {
  searchModest.value = value
}

function onToolbarAction(key: string) {
  ElMessage.success(`点击了工具按钮：${key}`)
}
</script>

<template>
  <CommonPages
    title="通用组件引用展示页"
    table-title="演示列表"
    :search-items="commonPagesSearchItems"
    :table-columns="commonPagesTableColumns"
    :table-data="rows"
    :loading="loading"
    :pagination="{
      currentPage: pager.page,
      pageSize: pager.pageSize,
      total: pager.total,
    }"
    :toolbar-buttons="[
      { key: 'create', text: '新增', type: 'primary' },
      { key: 'export', text: '导出' },
    ]"
    :action-column="{
      label: '操作',
      width: 120,
      buttons: [
        { key: 'view', text: '查看', type: 'primary' },
        { key: 'edit', text: '编辑' },
      ],
    }"
    :search-modest="searchModest"
    @update:search-modest="onSearchModelUpdate"
    @search="onSearch"
    @reset="onSearch"
    @table-action="onAction"
    @toolbar-action="onToolbarAction"
  >
    <template #toolbar-prefix>
      <el-tag type="info">commonPages</el-tag>
    </template>

    <template #status="{ row }">
      <el-tag v-if="row.status === 'published'" type="success" size="small">已发布</el-tag>
      <el-tag v-else-if="row.status === 'in_review'" type="warning" size="small">审批中</el-tag>
      <el-tag v-else size="small">草稿</el-tag>
    </template>
  </CommonPages>
</template>
