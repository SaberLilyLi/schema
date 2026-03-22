import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as authApi from '@/api/auth'
import type { LoginUser, MeData } from '@/types/api'
import { getToken, setToken } from '@/api/http'

export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(getToken())
  const user = ref<LoginUser | MeData | null>(null)

  const isLoggedIn = computed(() => Boolean(token.value))
  const displayLabel = computed(
    () => user.value?.displayName || user.value?.username || '用户',
  )

  function hasPermission(code: string) {
    return user.value?.permissions?.includes(code) ?? false
  }

  async function login(username: string, password: string) {
    const data = await authApi.login({ username, password })
    setToken(data.accessToken)
    token.value = data.accessToken
    user.value = data.user
  }

  async function register(payload: {
    username: string
    password: string
    displayName?: string
    email?: string
  }) {
    const data = await authApi.register(payload)
    setToken(data.accessToken)
    token.value = data.accessToken
    user.value = data.user
  }

  async function loadProfile() {
    const data = await authApi.fetchMe()
    user.value = data
  }

  function logout() {
    setToken(null)
    token.value = null
    user.value = null
  }

  return {
    token,
    user,
    isLoggedIn,
    displayLabel,
    hasPermission,
    login,
    register,
    loadProfile,
    logout,
  }
})
