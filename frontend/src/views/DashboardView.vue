<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Document, Plus, Connection } from '@element-plus/icons-vue'
import { getHealth } from '@/api/system'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const dbStatus = ref<string>('检测中…')

onMounted(async () => {
  try {
    const res = await getHealth()
    dbStatus.value = res.data.db === 'connected' ? '已连接' : '未连接'
  } catch {
    dbStatus.value = '不可用'
  }
})

function goKnowledge() {
  router.push({ name: 'knowledge-list' })
}

function goCreate() {
  router.push({ name: 'knowledge-create' })
}
</script>

<template>
  <div class="dash">
    <el-row :gutter="16">
      <el-col :xs="24" :sm="12" :md="8">
        <el-card shadow="never" class="dash__card">
          <div class="dash__card-title">系统状态</div>
          <p class="dash__card-desc">
            数据库：
            <el-tag :type="dbStatus === '已连接' ? 'success' : 'warning'" size="small">
              {{ dbStatus }}
            </el-tag>
          </p>
          <p class="dash__card-desc">当前用户：{{ userStore.displayLabel }}</p>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="8">
        <el-card shadow="never" class="dash__card dash__card--action" @click="goKnowledge">
          <el-icon class="dash__icon"><Document /></el-icon>
          <div class="dash__card-title">知识库</div>
          <p class="dash__card-desc">检索制度、流程与操作指引</p>
        </el-card>
      </el-col>
      <el-col
        v-if="userStore.hasPermission('kb:create')"
        :xs="24"
        :sm="12"
        :md="8"
      >
        <el-card shadow="never" class="dash__card dash__card--action" @click="goCreate">
          <el-icon class="dash__icon"><Plus /></el-icon>
          <div class="dash__card-title">新建知识</div>
          <p class="dash__card-desc">创建草稿并提交审批</p>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="dash__hint">
      <template #header>
        <span class="dash__hint-title">
          <el-icon><Connection /></el-icon>
          合规提示
        </span>
      </template>
      <p>敏感信息禁止外传；导出与下载将留痕审计。请遵循最小权限与密级策略。</p>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.dash {
  max-width: 1100px;
}

.dash__card {
  height: 100%;
  min-height: 140px;
  margin-bottom: 16px;
}

.dash__card--action {
  cursor: pointer;
  transition: box-shadow 0.2s, border-color 0.2s;
  border: 1px solid transparent;

  &:hover {
    border-color: var(--el-color-primary-light-5);
    box-shadow: var(--el-box-shadow-light);
  }
}

.dash__icon {
  font-size: 28px;
  color: var(--el-color-primary);
  margin-bottom: 8px;
}

.dash__card-title {
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 8px;
}

.dash__card-desc {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.dash__hint {
  margin-top: 8px;
}

.dash__hint-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
}

.dash__hint p {
  margin: 0;
  font-size: 14px;
  color: var(--el-text-color-regular);
  line-height: 1.6;
}
</style>
