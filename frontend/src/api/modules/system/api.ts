import http from '@/api/http'
import type { GetHealthRsp } from '@/types/interfaces/system/rsp'

export function getHealth() {
  return http.post<GetHealthRsp>('/health')
}
