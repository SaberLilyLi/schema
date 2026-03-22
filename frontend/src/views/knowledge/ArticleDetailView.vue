<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { ElMessage } from 'element-plus'
import { fetchArticleDetail } from '@/api/articles'
import type { ArticleDetailData } from '@/types/api'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const detail = ref<ArticleDetailData | null>(null)
const htmlContent = ref('')

async function load() {
  const id = route.params.id as string
  loading.value = true
  detail.value = null
  htmlContent.value = ''
  try {
    const data = await fetchArticleDetail(id)
    detail.value = data
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
