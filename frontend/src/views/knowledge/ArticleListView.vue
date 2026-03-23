<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { fetchArticleList } from '@/api/articles'
import type { ArticleListItem } from '@/types/api'
import CommonPages from '@/components/common/commonPages/CommonPages.vue'
import type { CommonTableColumn } from '@/components/common/commonTable/types'
import type { SearchItemConfig } from '@/components/common/commonSearch/types'

const router = useRouter()

const loading = ref(false)
const items = ref<ArticleListItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

const searchModest = ref<Record<string, unknown>>({
  q: '',
  domain: '',
  status: '',
})

const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '草稿', value: 'draft' },
  { label: '审批中', value: 'in_review' },
  { label: '已发布', value: 'published' },
  { label: '已归档', value: 'archived' },
]

const searchItems: SearchItemConfig[] = [
  {
    key: 'q',
    label: '关键词',
    component: 'input',
    placeholder: '标题 / 编号 / 正文',
    width: '220px',
  },
  {
    key: 'domain',
    label: '条线',
    component: 'input',
    placeholder: '如 柜面/对公',
    width: '160px',
  },
  {
    key: 'status',
    label: '状态',
    component: 'select',
    width: '140px',
    options: statusOptions,
  },
]

const tableColumns: CommonTableColumn[] = [
  {
    key: 'articleNo',
    prop: 'articleNo',
    label: '编号',
    width: 150,
    showOverflowTooltip: true,
  },
  {
    key: 'title',
    prop: 'title',
    label: '标题',
    minWidth: 220,
    showOverflowTooltip: true,
  },
  {
    key: 'domain',
    prop: 'domain',
    label: '条线',
    width: 120,
    showOverflowTooltip: true,
  },
  {
    key: 'classification',
    prop: 'classification',
    label: '密级',
    width: 110,
    slotName: 'classification',
  },
  {
    key: 'status',
    prop: 'status',
    label: '状态',
    width: 100,
    slotName: 'status',
  },
  {
    key: 'tags',
    prop: 'tags',
    label: '标签',
    minWidth: 140,
    slotName: 'tags',
  },
  {
    key: 'updatedAt',
    prop: 'updatedAt',
    label: '更新时间',
    width: 170,
    slotName: 'updatedAt',
  },
]

async function load() {
  loading.value = true
  try {
    const data = await fetchArticleList({
      page: page.value,
      pageSize: pageSize.value,
      q: (searchModest.value.q as string) || undefined,
      domain: (searchModest.value.domain as string) || undefined,
      status: (searchModest.value.status as string) || undefined,
    })
    items.value = data.items
    total.value = data.total
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '加载失败')
  } finally {
    loading.value = false
  }
}

onMounted(load)

function onSearch() {
  page.value = 1
  load()
}

function onPageChange(p: number) {
  page.value = p
  load()
}

function onSizeChange(s: number) {
  pageSize.value = s
  page.value = 1
  load()
}

function goDetail(row: ArticleListItem) {
  router.push({ name: 'knowledge-detail', params: { id: row.id } })
}

function onRowClick(row: Record<string, unknown>) {
  goDetail(row as unknown as ArticleListItem)
}

function onSearchModelUpdate(value: Record<string, unknown>) {
  searchModest.value = value
}

function onToolbarAction(key: string) {
  if (key === 'create') {
    router.push({ name: 'knowledge-create' })
  }
}
</script>

<template>
  <CommonPages
    title="知识库"
    :table-title="'知识列表'"
    :search-items="searchItems"
    :table-columns="tableColumns"
    :table-data="items"
    :loading="loading"
    :pagination="{
      currentPage: page,
      pageSize,
      total,
      pageSizes: [10, 20, 50],
      layout: 'total, sizes, prev, pager, next',
    }"
    :toolbar-buttons="[{ key: 'create', text: '新建知识', type: 'primary' }]"
    :search-modest="searchModest"
    @update:search-modest="onSearchModelUpdate"
    @search="onSearch"
    @reset="onSearch"
    @page-change="onPageChange"
    @size-change="onSizeChange"
    @row-click="onRowClick"
    @toolbar-action="onToolbarAction"
  >
    <template #toolbar-prefix>
      <el-tag type="info" effect="plain">commonPages</el-tag>
    </template>

    <template #classification="{ row }">
      <el-tag size="small" type="info">{{ row.classification }}</el-tag>
    </template>

    <template #status="{ row }">
      <el-tag v-if="row.status === 'published'" size="small" type="success">已发布</el-tag>
      <el-tag
        v-else-if="row.status === 'in_review' && row.workflowState === 'approved'"
        size="small"
        type="primary"
      >
        已审批待发布
      </el-tag>
      <el-tag v-else-if="row.status === 'in_review'" size="small" type="warning">审批中</el-tag>
      <el-tag v-else-if="row.status === 'draft'" size="small">草稿</el-tag>
      <el-tag v-else size="small" type="info">{{ row.status }}</el-tag>
    </template>

    <template #tags="{ row }">
      <el-tag
        v-for="t in row.tags"
        :key="t"
        size="small"
        class="list__tag"
      >
        {{ t }}
      </el-tag>
    </template>

    <template #updatedAt="{ row }">
      {{ row.updatedAt?.replace('T', ' ').slice(0, 19) }}
    </template>
  </CommonPages>
</template>

<style scoped lang="scss">
.list__tag {
  margin-right: 4px;
  margin-bottom: 2px;
}

:deep(.el-table__row) {
  cursor: pointer;
}

:deep(.is-muted) {
  opacity: 0.92;
}
</style>
