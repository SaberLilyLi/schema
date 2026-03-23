<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import CommonPages from '@/components/common/commonPages/CommonPages.vue'
import type { SearchItemConfig } from '@/components/common/commonSearch/types'
import type { CommonTableColumn } from '@/components/common/commonTable/types'
import { fetchAuditLogDetail, fetchAuditLogs } from '@/api/audit'
import type { AuditLogDetailData, AuditLogListItem } from '@/types/api'

const TEXT = {
  actor: '\u64cd\u4f5c\u4eba',
  action: '\u52a8\u4f5c',
  resourceType: '\u8d44\u6e90\u7c7b\u578b',
  resourceId: '\u8d44\u6e90\u6807\u8bc6',
  requestId: '\u8bf7\u6c42ID',
  result: '\u7ed3\u679c',
  all: '\u5168\u90e8',
  success: '\u6210\u529f',
  failed: '\u5931\u8d25',
  timeRange: '\u65f6\u95f4\u8303\u56f4',
  startTime: '\u5f00\u59cb\u65f6\u95f4',
  endTime: '\u7ed3\u675f\u65f6\u95f4',
  seq: '\u5e8f\u53f7',
  occurredAt: '\u53d1\u751f\u65f6\u95f4',
  statusCode: '\u72b6\u6001\u7801',
  loadFailed: '\u52a0\u8f7d\u5931\u8d25',
  loadDetailFailed: '\u52a0\u8f7d\u8be6\u60c5\u5931\u8d25',
  auditCenter: '\u5ba1\u8ba1\u4e2d\u5fc3',
  auditLog: '\u5ba1\u8ba1\u65e5\u5fd7',
  auditLogDetail: '\u5ba1\u8ba1\u65e5\u5fd7\u8be6\u60c5',
} as const

const loading = ref(false)
const items = ref<AuditLogListItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const detailLoading = ref(false)
const detailVisible = ref(false)
const detail = ref<AuditLogDetailData | null>(null)

const searchModest = ref<Record<string, unknown>>({
  actor: '',
  action: '',
  resourceType: '',
  requestId: '',
  success: '',
  timeRange: [],
})

const searchItems: SearchItemConfig[] = [
  { key: 'actor', label: TEXT.actor, component: 'input', placeholder: '\u7528\u6237\u540d\u6a21\u7cca\u5339\u914d' },
  { key: 'action', label: TEXT.action, component: 'input', placeholder: '\u5982 kb.read' },
  { key: 'resourceType', label: TEXT.resourceType, component: 'input', placeholder: '\u5982 article' },
  { key: 'requestId', label: TEXT.requestId, component: 'input', placeholder: '\u7cbe\u786e\u5339\u914d' },
  {
    key: 'success',
    label: TEXT.result,
    component: 'select',
    options: [
      { label: TEXT.all, value: '' },
      { label: TEXT.success, value: 'true' },
      { label: TEXT.failed, value: 'false' },
    ],
  },
  {
    key: 'timeRange',
    label: TEXT.timeRange,
    component: 'dateRange',
    componentProps: {
      valueFormat: 'YYYY-MM-DDTHH:mm:ss.SSS[Z]',
      type: 'datetimerange',
      startPlaceholder: TEXT.startTime,
      endPlaceholder: TEXT.endTime,
    },
  },
]

const tableColumns: CommonTableColumn[] = [
  { key: 'seq', prop: 'seq', label: TEXT.seq, width: 90 },
  { key: 'occurredAt', prop: 'occurredAt', label: TEXT.occurredAt, width: 170, slotName: 'occurredAt' },
  { key: 'action', prop: 'action', label: TEXT.action, minWidth: 160, showOverflowTooltip: true },
  { key: 'actorUsername', prop: 'actorUsername', label: TEXT.actor, width: 120, showOverflowTooltip: true },
  { key: 'resourceType', prop: 'resourceType', label: TEXT.resourceType, width: 110 },
  { key: 'resourceId', prop: 'resourceId', label: TEXT.resourceId, minWidth: 120, showOverflowTooltip: true },
  { key: 'success', prop: 'success', label: TEXT.result, width: 90, slotName: 'success' },
  { key: 'statusCode', prop: 'statusCode', label: TEXT.statusCode, width: 90 },
  { key: 'requestId', prop: 'requestId', label: TEXT.requestId, minWidth: 170, showOverflowTooltip: true },
]

function normalizeTimeRange() {
  const v = searchModest.value.timeRange
  if (!Array.isArray(v) || v.length !== 2) {
    return { startAt: undefined, endAt: undefined }
  }
  const [startAt, endAt] = v
  return {
    startAt: typeof startAt === 'string' ? startAt : undefined,
    endAt: typeof endAt === 'string' ? endAt : undefined,
  }
}

async function load() {
  loading.value = true
  try {
    const { startAt, endAt } = normalizeTimeRange()
    const data = await fetchAuditLogs({
      page: page.value,
      pageSize: pageSize.value,
      actor: (searchModest.value.actor as string) || undefined,
      action: (searchModest.value.action as string) || undefined,
      resourceType: (searchModest.value.resourceType as string) || undefined,
      requestId: (searchModest.value.requestId as string) || undefined,
      success: (searchModest.value.success as '' | 'true' | 'false') || '',
      startAt,
      endAt,
    })
    items.value = data.items
    total.value = data.total
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : TEXT.loadFailed)
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

function onSearchModelUpdate(value: Record<string, unknown>) {
  searchModest.value = value
}

async function openDetail(row: Record<string, unknown>) {
  const id = String(row.id || '')
  if (!id) return
  detailVisible.value = true
  detailLoading.value = true
  detail.value = null
  try {
    detail.value = await fetchAuditLogDetail(id)
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : TEXT.loadDetailFailed)
  } finally {
    detailLoading.value = false
  }
}

function fmtTime(v?: string | null) {
  if (!v) return '-'
  return v.replace('T', ' ').slice(0, 19)
}
</script>

<template>
  <section>
    <CommonPages
      :title="TEXT.auditCenter"
      :table-title="TEXT.auditLog"
      :search-items="searchItems"
      :search-modest="searchModest"
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
      @update:search-modest="onSearchModelUpdate"
      @search="onSearch"
      @reset="onSearch"
      @page-change="onPageChange"
      @size-change="onSizeChange"
      @row-click="openDetail"
    >
      <template #success="{ row }">
        <el-tag :type="row.success ? 'success' : 'danger'" size="small">
          {{ row.success ? TEXT.success : TEXT.failed }}
        </el-tag>
      </template>

      <template #occurredAt="{ row }">
        {{ fmtTime(row.occurredAt) }}
      </template>
    </CommonPages>

    <el-drawer
      v-model="detailVisible"
      :title="TEXT.auditLogDetail"
      size="48%"
      destroy-on-close
    >
      <el-skeleton v-if="detailLoading" animated :rows="10" />
      <el-descriptions v-else-if="detail" :column="1" border>
        <el-descriptions-item :label="TEXT.seq">{{ detail.seq }}</el-descriptions-item>
        <el-descriptions-item :label="TEXT.occurredAt">{{ fmtTime(detail.occurredAt) }}</el-descriptions-item>
        <el-descriptions-item :label="TEXT.actor">{{ detail.actorUsername || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="TEXT.action">{{ detail.action }}</el-descriptions-item>
        <el-descriptions-item :label="TEXT.resourceType">{{ detail.resourceType || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="TEXT.resourceId">{{ detail.resourceId || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="TEXT.requestId">{{ detail.requestId || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="TEXT.statusCode">{{ detail.statusCode ?? '-' }}</el-descriptions-item>
        <el-descriptions-item :label="TEXT.result">
          <el-tag :type="detail.success ? 'success' : 'danger'" size="small">
            {{ detail.success ? TEXT.success : TEXT.failed }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="IP">{{ detail.ip || '-' }}</el-descriptions-item>
        <el-descriptions-item label="User-Agent">{{ detail.userAgent || '-' }}</el-descriptions-item>
        <el-descriptions-item label="Prev Hash">
          <div class="audit-center__hash">{{ detail.prevHash || '-' }}</div>
        </el-descriptions-item>
        <el-descriptions-item label="Record Hash">
          <div class="audit-center__hash">{{ detail.recordHash || '-' }}</div>
        </el-descriptions-item>
        <el-descriptions-item label="Details JSON">
          <pre class="audit-center__json">{{ JSON.stringify(detail.details ?? {}, null, 2) }}</pre>
        </el-descriptions-item>
      </el-descriptions>
    </el-drawer>
  </section>
</template>

<style scoped lang="scss">
.audit-center__json {
  margin: 0;
  padding: 10px;
  border-radius: 6px;
  background: var(--el-fill-color-light);
  max-height: 260px;
  overflow: auto;
  font-size: 12px;
  line-height: 1.45;
}

.audit-center__hash {
  word-break: break-all;
}

:deep(.el-table__row) {
  cursor: pointer;
}
</style>
