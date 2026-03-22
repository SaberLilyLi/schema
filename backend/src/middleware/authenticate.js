import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { fail } from '../utils/apiEnvelope.js'
import { getUserWithIam } from '../services/iamService.js'

export async function authenticate(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return fail(res, '未登录', 40101, 401)
  }
  if (!env.jwtSecret) {
    return fail(res, '服务器未配置 JWT_SECRET', 50001, 500)
  }
  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, env.jwtSecret)
    const sub = payload.sub
    const iam = await getUserWithIam(sub)
    if (!iam) {
      return fail(res, '用户不存在', 40102, 401)
    }
    req.userId = sub
    req.username = iam.user.username
    req.displayName = iam.user.displayName
    req.roles = iam.roles
    req.permissions = iam.permissions
    next()
  } catch {
    return fail(res, '无效或已过期的凭证', 40103, 401)
  }
}

export function requirePermission(code) {
  return (req, res, next) => {
    if (!req.permissions?.includes(code)) {
      return fail(res, '权限不足', 40301, 403)
    }
    next()
  }
}
