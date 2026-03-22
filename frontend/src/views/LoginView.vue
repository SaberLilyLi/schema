<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { User, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const username = ref('')
const password = ref('')
const loading = ref(false)

async function onSubmit() {
  if (!username.value.trim() || !password.value) {
    ElMessage.warning('请输入用户名和密码')
    return
  }
  loading.value = true
  try {
    await userStore.login(username.value.trim(), password.value)
    const redirect = (route.query.redirect as string) || '/dashboard'
    await router.replace(redirect)
    ElMessage.success('登录成功')
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login">
    <el-card class="login__card" shadow="hover">
      <template #header>
        <div class="login__title">银行知识库</div>
        <div class="login__sub">内部制度与知识统一检索</div>
      </template>
      <el-form size="large" @submit.prevent="onSubmit">
        <el-form-item>
          <el-input
            v-model="username"
            placeholder="用户名"
            :prefix-icon="User"
            autocomplete="username"
          />
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="password"
            type="password"
            placeholder="密码"
            :prefix-icon="Lock"
            show-password
            autocomplete="current-password"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            native-type="submit"
            class="login__btn"
            :loading="loading"
          >
            登录
          </el-button>
        </el-form-item>
        <div class="login__footer">
          没有账号？
          <el-button link type="primary" @click="router.push({ name: 'register' })">
            立即注册
          </el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(160deg, #e8eef7 0%, #f5f7fa 45%, #dce6f5 100%);
}

.login__card {
  width: 400px;
  max-width: 92vw;
  border-radius: 12px;
}

.login__title {
  font-size: 22px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  text-align: center;
}

.login__sub {
  margin-top: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  text-align: center;
}

.login__btn {
  width: 100%;
}

.login__footer {
  text-align: center;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}
</style>
