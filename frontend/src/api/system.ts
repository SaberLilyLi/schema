import http from './http'

export function getHealth() {
  return http.post<{ ok: boolean; message: string; db: string }>('/health')
}
