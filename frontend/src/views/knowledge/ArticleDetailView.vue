<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  approveArticle,
  fetchArticleDetail,
  fetchArticleVersions,
  publishArticle,
  rejectArticle,
  submitArticle,
} from '@/api/articles'
import type { ArticleDetailRsp, ArticleVersionItem } from '@/types/interfaces/article/rsp'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(true)
const detail = ref<ArticleDetailRsp | null>(null)
const htmlContent = ref('')
const versions = ref<ArticleVersionItem[]>([])
const versionsVisible = ref(false)
const actionLoading = ref(false)

async function load() {
  const id = route.params.id as string
  loading.value = true
  detail.value = null
  htmlContent.value = ''
  try {
    const data = await fetchArticleDetail(id)
    detail.value = data
    versions.value = await fetchArticleVersions(id)
    const md = data.currentVersion?.contentMd ?? ''
    if (md) {
      const raw = await marked.parse(md)
      htmlContent.value = DOMPurify.sanitize(
        typeof raw === 'string' ? raw : String(raw),
      )
    }
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '加载失败')
  } finally {
    loading.value = false
  }
}

watch(
  () => route.params.id,
  () => {
    load()
  },
  { immediate: true },
)

function back() {
  router.push({ name: 'knowledge-list' })
}

const canSubmit = computed(
  () =>
    userStore.hasPermission('kb:submit') &&
    ['draft', 'rejected'].includes(
      detail.value?.currentVersion?.workflowState || '',
    ),
)
const canApprove = computed(
  () =>
    userStore.hasPermission('approval:approve') &&
    detail.value?.currentVersion?.workflowState === 'submitted',
)
const canReject = computed(
  () =>
    userStore.hasPermission('approval:approve') &&
    ['submitted', 'approved'].includes(
      detail.value?.currentVersion?.workflowState || '',
    ),
)
const canPublish = computed(
  () =>
    userStore.hasPermission('kb:publish') &&
    ['approved'].includes(
      detail.value?.currentVersion?.workflowState || '',
    ),
)
const canEdit = computed(
  () =>
    userStore.hasPermission('kb:edit') &&
    ['draft', 'rejected', 'published'].includes(
      detail.value?.currentVersion?.workflowState || '',
    ),
)

async function doSubmit() {
  if (!detail.value) return
  actionLoading.value = true
  try {
    await submitArticle(detail.value.id)
    ElMessage.success('提交审批成功')
    await load()
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '提交失败')
  } finally {
    actionLoading.value = false
  }
}

async function doApprove() {
  if (!detail.value) return
  actionLoading.value = true
  try {
    await approveArticle(detail.value.id)
    ElMessage.success('审批通过')
    await load()
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '审批失败')
  } finally {
    actionLoading.value = false
  }
}

async function doReject() {
  if (!detail.value) return
  try {
    const reason = await ElMessageBox.prompt('请输入驳回原因', '驳回版本', {
      confirmButtonText: '确认驳回',
      cancelButtonText: '取消',
      inputPlaceholder: '例如：正文不完整，需要补充附件',
    })
    actionLoading.value = true
    await rejectArticle(detail.value.id, reason.value.trim())
    ElMessage.success('已驳回')
    await load()
  } catch (e) {
    if (e !== 'cancel' && e !== 'close') {
      ElMessage.error(e instanceof Error ? e.message : '驳回失败')
    }
  } finally {
    actionLoading.value = false
  }
}

async function doPublish() {
  if (!detail.value) return
  actionLoading.value = true
  try {
    await publishArticle(detail.value.id)
    ElMessage.success('发布成功')
    await load()
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '发布失败')
  } finally {
    actionLoading.value = false
  }
}

function goEdit() {
  if (!detail.value) return
  router.push({ name: 'knowledge-edit', params: { id: detail.value.id } })
}
</script>

<template>
  <div v-loading="loading" class="detail">
    <template v-if="detail">
      <el-page-header class="detail__back" @back="back">
        <template #content>
          <span class="detail__heading">{{ detail.title }}</span>
        </template>
        <template #extra>
          <el-tag size="small" type="info">{{ detail.articleNo }}</el-tag>
          <el-tag size="small" class="detail__meta">{{ detail.domain }}</el-tag>
          <el-tag size="small">{{ detail.classification }}</el-tag>
          <el-tag
            v-if="detail.status === 'published'"
            size="small"
            type="success"
          >已发布</el-tag>
          <el-tag v-else size="small" type="warning">{{ detail.status }}</el-tag>
          <el-button
            size="small"
            @click="versionsVisible = true"
          >
            版本列表
          </el-button>
          <el-button
            v-if="canEdit"
            size="small"
            type="primary"
            plain
            @click="goEdit"
          >
            编辑
          </el-button>
          <el-button
            v-if="canSubmit"
            type="primary"
            size="small"
            :loading="actionLoading"
            @click="doSubmit"
          >
            提交审批
          </el-button>
          <el-button
            v-if="canApprove"
            type="success"
            size="small"
            :loading="actionLoading"
            @click="doApprove"
          >
            审批通过
          </el-button>
          <el-button
            v-if="canReject"
            type="warning"
            size="small"
            :loading="actionLoading"
            @click="doReject"
          >
            驳回
          </el-button>
          <el-button
            v-if="canPublish"
            type="danger"
            size="small"
            :loading="actionLoading"
            @click="doPublish"
          >
            发布
          </el-button>
        </template>
      </el-page-header>

      <div v-if="detail.tags?.length" class="detail__tags">
        <el-tag v-for="t in detail.tags" :key="t" size="small" effect="plain">
          {{ t }}
        </el-tag>
      </div>

      <el-card shadow="never" class="detail__body">
        <div v-if="detail.currentVersion" class="detail__version">
          <span>版本 v{{ detail.currentVersion.versionNo }}</span>
          <span v-if="detail.currentVersion.changeSummary" class="detail__summary">
            · {{ detail.currentVersion.changeSummary }}
          </span>
        </div>
        <div
          v-if="htmlContent"
          class="detail__md prose"
          v-html="htmlContent"
        />
        <el-empty v-else description="暂无正文" />
      </el-card>
    </template>

    <el-drawer
      v-model="versionsVisible"
      title="版本列表"
      size="520px"
    >
      <el-table :data="versions" stripe>
        <el-table-column prop="versionNo" label="版本号" width="80">
          <template #default="{ row }">v{{ row.versionNo }}</template>
        </el-table-column>
        <el-table-column prop="workflowState" label="流程状态" width="120" />
        <el-table-column prop="changeSummary" label="变更说明" min-width="200" show-overflow-tooltip />
        <el-table-column prop="publishedAt" label="发布时间" width="170">
          <template #default="{ row }">
            {{ row.publishedAt ? row.publishedAt.replace('T', ' ').slice(0, 19) : '-' }}
          </template>
        </el-table-column>
      </el-table>
    </el-drawer>
  </div>
</template>

<style scoped lang="scss">
.detail__back {
  margin-bottom: 12px;
}

.detail__heading {
  font-size: 18px;
  font-weight: 600;
}

.detail__meta {
  margin-left: 4px;
}

.detail__tags {
  margin-bottom: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.detail__body {
  min-height: 200px;
}

.detail__version {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-bottom: 12px;
}

.detail__summary {
  margin-left: 4px;
}

.detail__md {
  font-size: 14px;
  line-height: 1.7;
  color: var(--el-text-color-primary);

  :deep(h1),
  :deep(h2),
  :deep(h3) {
    margin: 0.8em 0 0.4em;
    font-weight: 600;
  }

  :deep(p) {
    margin: 0.5em 0;
  }

  :deep(ul),
  :deep(ol) {
    padding-left: 1.4em;
  }

  :deep(blockquote) {
    margin: 0.5em 0;
    padding-left: 12px;
    border-left: 3px solid var(--el-border-color);
    color: var(--el-text-color-secondary);
  }
}
</style>
