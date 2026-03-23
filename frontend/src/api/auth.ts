import http from './http'
import type { ApiEnvelope, LoginData, MeData } from '@/types/api'

export async function login(payload: { username: string; password: string }) {
  const { data } = await http.post<ApiEnvelope<LoginData>>('/auth/login', payload)
  return data.data
}

export async function register(payload: {
  username: string
  password: string
  displayName?: string
  email?: string
}) {
  const { data } = await http.post<ApiEnvelope<LoginData>>('/auth/register', payload)
  return data.data
}

export async function fetchMe() {
  const { data } = await http.post<ApiEnvelope<MeData>>('/auth/me')
  return data.data
}
