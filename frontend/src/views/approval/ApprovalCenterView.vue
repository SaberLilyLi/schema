<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import CommonPages from '@/components/common/commonPages/CommonPages.vue'
import type { CommonTableColumn } from '@/components/common/commonTable/types'
import type { SearchItemConfig } from '@/components/common/commonSearch/types'
import type { ApprovalListItem } from '@/types/api'
import { fetchApprovalInitiated, fetchApprovalPending } from '@/api/articles'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const activeTab = ref<'pending' | 'initiated'>('pending')
const loading = ref(false)
const items = ref<ApprovalListItem[]>([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const searchModest = ref<Record<string, unknown>>({})
const searchItems: SearchItemConfig[] = []
const canApprove = userStore.hasPermission('approval:approve')
const canSubmit = userStore.hasPermission('kb:submit')

const columns: CommonTableColumn[] = [
  { key: 'articleNo', prop: 'articleNo', label: '编号', width: 150, showOverflowTooltip: true },
  { key: 'title', prop: 'title', label: '标题', minWidth: 220, showOverflowTooltip: true },
  { key: 'domain', prop: 'domain', label: '条线', width: 120 },
  { key: 'workflowState', prop: 'workflowState', label: '流程状态', width: 120, slotName: 'workflowState' },
  { key: 'versionNo', prop: 'versionNo', label: '版本', width: 80, slotName: 'versionNo' },
  { key: 'submittedAt', prop: 'submittedAt', label: '提交时间', width: 170, slotName: 'submittedAt' },
]

async function load() {
  loading.value = true
  try {
    if (activeTab.value === 'pending' && !canApprove) {
      items.value = []
      total.value = 0
      return
    }

    if (activeTab.value === 'initiated' && !canSubmit) {
      items.value = []
      total.value = 0
      return
    }

    const data =
      activeTab.value === 'pending'
        ? await fetchApprovalPending({ page: page.value, pageSize: pageSize.value })
        : await fetchApprovalInitiated({ page: page.value, pageSize: pageSize.value })
    items.value = data.items
    total.value = data.total
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '加载失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (!canApprove) {
    activeTab.value = 'initiated'
  }
  load()
})

function onTabChange() {
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

function onRowClick(row: Record<string, unknown>) {
  router.push({ name: 'knowledge-detail', params: { id: row.id as string } })
}
</script>

<template>
  <CommonPages
    title="审批中心"
    :table-title="activeTab === 'pending' ? '待我审批' : '我发起的'"
    :search-items="searchItems"
    :search-modest="searchModest"
    :table-columns="columns"
    :table-data="items"
    :loading="loading"
    :pagination="{ currentPage: page, pageSize, total, pageSizes: [10, 20, 50] }"
    :toolbar-buttons="[]"
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

    <template #versionNo="{ row }">
      v{{ row.versionNo }}
    </template>

    <template #submittedAt="{ row }">
      {{ row.submittedAt ? row.submittedAt.replace('T', ' ').slice(0, 19) : '-' }}
    </template>
  </CommonPages>
</template>
