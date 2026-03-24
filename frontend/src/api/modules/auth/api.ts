import http from '@/api/http'
import type { ApiEnvelope } from '../common/rsp'
import type { LoginReq, RegisterReq } from '@/types/interfaces/auth/req'
import type { LoginRsp, MeRsp } from '@/types/interfaces/auth/rsp'

export async function login(payload: LoginReq) {
  const { data } = await http.post<ApiEnvelope<LoginRsp>>('/auth/login', payload)
  return data.data
}

export async function register(payload: RegisterReq) {
  const { data } = await http.post<ApiEnvelope<LoginRsp>>('/auth/register', payload)
  return data.data
}

export async function fetchMe() {
  const { data } = await http.post<ApiEnvelope<MeRsp>>('/auth/me')
  return data.data
}
