<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import CommonPages from '@/components/common/commonPages/CommonPages.vue'
import type { CommonTableColumn } from '@/components/common/commonTable/types'
import type { SearchItemConfig } from '@/components/common/commonSearch/types'
import type { ApprovalListItem } from '@/types/interfaces/article/rsp'
import {
  fetchApprovalHistory,
  fetchApprovalInitiated,
  fetchApprovalPending,
} from '@/api/articles'
import { useUserStore } from '@/stores/user'

type ApprovalTab = 'pending' | 'initiated' | 'history'

const router = useRouter()
const userStore = useUserStore()

const activeTab = ref<ApprovalTab>('pending')
const loading = ref(false)
const items = ref<ApprovalListItem[]>([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const searchModest = ref<Record<string, unknown>>({
  q: '',
  domain: '',
  workflowState: '',
  approver: '',
})
const canApprove = computed(() => userStore.hasPermission('approval:approve'))
const canSubmit = computed(() => userStore.hasPermission('kb:submit'))

const searchItems = computed<SearchItemConfig[]>(() => {
  const base: SearchItemConfig[] = [
    { key: 'q', label: '关键词', component: 'input', placeholder: '标题或编号' },
    { key: 'domain', label: '条线', component: 'input', placeholder: '如 零售/对公' },
  ]
  if (activeTab.value === 'initiated') {
    base.push({
      key: 'workflowState',
      label: '流程状态',
      component: 'select',
      options: [
        { label: '全部', value: '' },
        { label: '草稿', value: 'draft' },
        { label: '审批中', value: 'submitted' },
        { label: '已审批', value: 'approved' },
        { label: '已驳回', value: 'rejected' },
        { label: '已发布', value: 'published' },
      ],
    })
  }
  if (activeTab.value === 'history') {
    base.push(
      {
        key: 'workflowState',
        label: '审批结果',
        component: 'select',
        options: [
          { label: '全部', value: '' },
          { label: '已审批', value: 'approved' },
          { label: '已驳回', value: 'rejected' },
          { label: '已发布', value: 'published' },
        ],
      },
      { key: 'approver', label: '审批人', component: 'input', placeholder: '审批人姓名/用户名' },
    )
  }
  return base
})

const columns: CommonTableColumn[] = [
  { key: 'articleNo', prop: 'articleNo', label: '编号', width: 150, showOverflowTooltip: true },
  { key: 'title', prop: 'title', label: '标题', minWidth: 220, showOverflowTooltip: true },
  { key: 'domain', prop: 'domain', label: '条线', width: 120 },
  { key: 'workflowState', prop: 'workflowState', label: '流程状态', width: 120, slotName: 'workflowState' },
  { key: 'approverName', prop: 'approverName', label: '审批人', width: 140, slotName: 'approverName' },
  { key: 'versionNo', prop: 'versionNo', label: '版本', width: 80, slotName: 'versionNo' },
  { key: 'submittedAt', prop: 'submittedAt', label: '提交时间', width: 170, slotName: 'submittedAt' },
  { key: 'approvedAt', prop: 'approvedAt', label: '审批时间', width: 170, slotName: 'approvedAt' },
]

const tableTitle = computed(() => {
  if (activeTab.value === 'pending') return '待我审批'
  if (activeTab.value === 'initiated') return '我发起的'
  return '历史审批记录'
})

function buildQuery() {
  return {
    page: page.value,
    pageSize: pageSize.value,
    q: (searchModest.value.q as string) || undefined,
    domain: (searchModest.value.domain as string) || undefined,
    workflowState: (searchModest.value.workflowState as string) || undefined,
    approver: (searchModest.value.approver as string) || undefined,
  }
}

async function load() {
  loading.value = true
  try {
    if (activeTab.value === 'pending' && !canApprove.value) {
      items.value = []
      total.value = 0
      return
    }

    if (activeTab.value === 'initiated' && !canSubmit.value) {
      items.value = []
      total.value = 0
      return
    }

    const query = buildQuery()
    const data =
      activeTab.value === 'pending'
        ? await fetchApprovalPending(query)
        : activeTab.value === 'initiated'
          ? await fetchApprovalInitiated(query)
          : await fetchApprovalHistory(query)
    items.value = data.items
    total.value = data.total
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '加载失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (!canApprove.value) {
    activeTab.value = 'initiated'
  }
  load()
})

watch(
  () => [canApprove.value, canSubmit.value],
  ([approve, submit]) => {
    if (!approve && activeTab.value === 'pending') {
      activeTab.value = submit ? 'initiated' : 'pending'
    }
  },
)

function onTabChange() {
  page.value = 1
  load()
}

function onSearch() {
  page.value = 1
  load()
}

function onSearchModelUpdate(value: Record<string, unknown>) {
  searchModest.value = value
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

function onRowClick(row: Record<string, unknown>) {
  router.push({ name: 'knowledge-detail', params: { id: row.id as string } })
}
</script>

<template>
  <CommonPages
    title="审批中心"
    :table-title="tableTitle"
    :search-items="searchItems"
    :search-modest="searchModest"
    :table-columns="columns"
    :table-data="items"
    :loading="loading"
    :pagination="{ currentPage: page, pageSize, total, pageSizes: [10, 20, 50] }"
    :toolbar-buttons="[]"
    @update:search-modest="onSearchModelUpdate"
    @search="onSearch"
    @reset="onSearch"
    @page-change="onPageChange"
    @size-change="onSizeChange"
    @row-click="onRowClick"
  >
    <template #toolbar-prefix>
      <el-segmented
        v-model="activeTab"
        :options="
          [
            ...(canApprove ? [{ label: '待我审批', value: 'pending' }] : []),
            ...(canSubmit ? [{ label: '我发起的', value: 'initiated' }] : []),
            ...(canApprove ? [{ label: '历史审批', value: 'history' }] : []),
          ]
        "
        @change="onTabChange"
      />
    </template>

    <template #workflowState="{ row }">
      <el-tag
        v-if="row.workflowState === 'submitted'"
        type="warning"
        size="small"
      >
        审批中
      </el-tag>
      <el-tag
        v-else-if="row.workflowState === 'approved'"
        type="success"
        size="small"
      >
        已审批
      </el-tag>
      <el-tag
        v-else-if="row.workflowState === 'rejected'"
        type="danger"
        size="small"
      >
        已驳回
      </el-tag>
      <el-tag
        v-else-if="row.workflowState === 'published'"
        type="primary"
        size="small"
      >
        已发布
      </el-tag>
      <el-tag v-else size="small">{{ row.workflowState }}</el-tag>
    </template>

    <template #approverName="{ row }">
      {{ row.approverName || '-' }}
    </template>

    <template #versionNo="{ row }">
      v{{ row.versionNo }}
    </template>

    <template #submittedAt="{ row }">
      {{ row.submittedAt ? row.submittedAt.replace('T', ' ').slice(0, 19) : '-' }}
    </template>

    <template #approvedAt="{ row }">
      {{ row.approvedAt ? row.approvedAt.replace('T', ' ').slice(0, 19) : '-' }}
    </template>
  </CommonPages>
</template>
