import http from './http'

export function getHealth() {
  return http.get<{ ok: boolean; message: string; db: string }>('/health')
}
