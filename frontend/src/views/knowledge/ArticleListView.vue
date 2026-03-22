<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { fetchArticleList } from '@/api/articles'
import type { ArticleListItem } from '@/types/api'

const router = useRouter()

const loading = ref(false)
const items = ref<ArticleListItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

const query = ref({
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

async function load() {
  loading.value = true
  try {
    const data = await fetchArticleList({
      page: page.value,
      pageSize: pageSize.value,
      q: query.value.q || undefined,
      domain: query.value.domain || undefined,
      status: query.value.status || undefined,
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

function rowClassName({ row }: { row: ArticleListItem }) {
  return row.status === 'published' ? '' : 'is-muted'
}

function goDetail(row: ArticleListItem) {
  router.push({ name: 'knowledge-detail', params: { id: row.id } })
}
</script>

<template>
  <el-card shadow="never" class="list">
    <template #header>
      <span class="list__title">知识库</span>
    </template>

    <el-form :inline="true" class="list__filter" @submit.prevent="onSearch">
      <el-form-item label="关键词">
        <el-input
          v-model="query.q"
          clearable
          placeholder="标题 / 编号 / 正文"
          style="width: 220px"
          @keyup.enter="onSearch"
        />
      </el-form-item>
      <el-form-item label="条线">
        <el-input
          v-model="query.domain"
          clearable
          placeholder="如 柜面/对公"
          style="width: 160px"
        />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" style="width: 140px" clearable>
          <el-option
            v-for="o in statusOptions"
            :key="o.value"
            :label="o.label"
            :value="o.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :icon="Search" @click="onSearch">查询</el-button>
      </el-form-item>
    </el-form>

    <el-table
      v-loading="loading"
      :data="items"
      stripe
      :row-class-name="rowClassName"
      style="width: 100%"
      @row-click="(row: ArticleListItem) => goDetail(row)"
    >
      <el-table-column prop="articleNo" label="编号" width="150" show-overflow-tooltip />
      <el-table-column prop="title" label="标题" min-width="220" show-overflow-tooltip />
      <el-table-column prop="domain" label="条线" width="120" show-overflow-tooltip />
      <el-table-column prop="classification" label="密级" width="110">
        <template #default="{ row }">
          <el-tag size="small" type="info">{{ row.classification }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag v-if="row.status === 'published'" size="small" type="success">已发布</el-tag>
          <el-tag v-else-if="row.status === 'in_review'" size="small" type="warning">审批中</el-tag>
          <el-tag v-else-if="row.status === 'draft'" size="small">草稿</el-tag>
          <el-tag v-else size="small" type="info">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="标签" min-width="140">
        <template #default="{ row }">
          <el-tag
            v-for="t in row.tags"
            :key="t"
            size="small"
            class="list__tag"
          >
            {{ t }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="updatedAt" label="更新时间" width="170">
        <template #default="{ row }">
          {{ row.updatedAt?.replace('T', ' ').slice(0, 19) }}
        </template>
      </el-table-column>
    </el-table>

    <div class="list__pager">
      <el-pagination
        :current-page="page"
        :page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        background
        @current-change="onPageChange"
        @size-change="onSizeChange"
      />
    </div>
  </el-card>
</template>

<style scoped lang="scss">
.list__title {
  font-weight: 600;
  font-size: 16px;
}

.list__filter {
  margin-bottom: 8px;
}

.list__pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

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
