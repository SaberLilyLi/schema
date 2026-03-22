<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock, Message } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  username: '',
  displayName: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z0-9_]{3,32}$/,
      message: '3～32 位字母、数字或下划线',
      trigger: 'blur',
    },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, message: '至少 8 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (_rule, val, cb) => {
        if (val !== form.password) {
          cb(new Error('两次密码不一致'))
        } else {
          cb()
        }
      },
      trigger: 'blur',
    },
  ],
}

async function onSubmit() {
  await formRef.value?.validate().catch(() => Promise.reject())
  loading.value = true
  try {
    await userStore.register({
      username: form.username.trim(),
      password: form.password,
      displayName: form.displayName.trim() || undefined,
      email: form.email.trim() || undefined,
    })
    ElMessage.success('注册成功')
    await router.replace('/dashboard')
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '注册失败')
  } finally {
    loading.value = false
  }
}

function goLogin() {
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="reg">
    <el-card class="reg__card" shadow="hover">
      <template #header>
        <div class="reg__title">注册账号</div>
        <div class="reg__sub">注册后默认具备「普通员工」权限（查阅与起草知识）</div>
      </template>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        size="large"
        label-position="top"
        @submit.prevent="onSubmit"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="form.username"
            placeholder="字母、数字、下划线"
            :prefix-icon="User"
            autocomplete="username"
          />
        </el-form-item>
        <el-form-item label="显示名（可选）" prop="displayName">
          <el-input
            v-model="form.displayName"
            placeholder="不填则与用户名相同"
            maxlength="64"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="邮箱（可选）" prop="email">
          <el-input
            v-model="form.email"
            type="email"
            placeholder="name@bank.local"
            :prefix-icon="Message"
            autocomplete="email"
          />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="至少 8 位"
            :prefix-icon="Lock"
            show-password
            autocomplete="new-password"
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="再次输入密码"
            :prefix-icon="Lock"
            show-password
            autocomplete="new-password"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            native-type="submit"
            class="reg__btn"
            :loading="loading"
          >
            注册
          </el-button>
        </el-form-item>
        <div class="reg__footer">
          已有账号？
          <el-button link type="primary" @click="goLogin">去登录</el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.reg {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 0;
  background: linear-gradient(160deg, #e8eef7 0%, #f5f7fa 45%, #dce6f5 100%);
}

.reg__card {
  width: 440px;
  max-width: 92vw;
  border-radius: 12px;
}

.reg__title {
  font-size: 22px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  text-align: center;
}

.reg__sub {
  margin-top: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  text-align: center;
}

.reg__btn {
  width: 100%;
}

.reg__footer {
  text-align: center;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}
</style>
