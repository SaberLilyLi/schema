import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

const TOKEN_KEY = 'accessToken'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE ?? '/api',
  timeout: 30000,
})

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  config.headers = config.headers ?? {}
  config.headers['X-Request-Id'] = globalThis.crypto.randomUUID()
  const t = getToken()
  if (t) {
    config.headers.Authorization = `Bearer ${t}`
  }
  return config
})

http.interceptors.response.use(
  (response) => {
    const data = response.data as Record<string, unknown>
    const url = response.config.url ?? ''
    if (url.includes('/health') || !('code' in data)) {
      return response
    }
    if (typeof data.code === 'number' && data.code !== 0) {
      const msg = typeof data.message === 'string' ? data.message : '请求失败'
      return Promise.reject(new Error(msg))
    }
    return response
  },
  (err: AxiosError<{ message?: string }>) => {
    const status = err.response?.status
    const body = err.response?.data
    const bodyMsg =
      body &&
      typeof body === 'object' &&
      'message' in body &&
      typeof body.message === 'string'
        ? body.message
        : null
    if (status === 401) {
      setToken(null)
      const loginHref = new URL(
        'login',
        `${window.location.origin}${import.meta.env.BASE_URL}`,
      ).href
      if (window.location.href.split('?')[0] !== loginHref.split('?')[0]) {
        window.location.assign(loginHref)
      }
    }
    const msg = bodyMsg ?? err.message ?? '网络错误'
    return Promise.reject(new Error(msg))
  },
)

export default http
