<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="fb">
    <el-result icon="warning" title="无访问权限" sub-title="如需权限请联系系统管理员">
      <template #extra>
        <el-button type="primary" @click="router.push('/dashboard')">返回首页</el-button>
      </template>
    </el-result>
  </div>
</template>

<style scoped lang="scss">
.fb {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
