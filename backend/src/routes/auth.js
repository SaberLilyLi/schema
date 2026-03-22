import { Router } from 'express'
import argon2 from 'argon2'
import jwt from 'jsonwebtoken'
import { User } from '../models/user.js'
import { Role } from '../models/role.js'
import { UserRole } from '../models/userRole.js'
import { env } from '../config/env.js'
import { ok, fail } from '../utils/apiEnvelope.js'
import { appendAuditLog } from '../services/auditService.js'
import { authenticate } from '../middleware/authenticate.js'
import { getUserWithIam } from '../services/iamService.js'

export const authRouter = Router()

const USERNAME_RE = /^[a-zA-Z0-9_]{3,32}$/

authRouter.post('/register', async (req, res) => {
  const requestId = res.locals.requestId
  const { username, password, displayName, email } = req.body ?? {}
  if (!username || !password) {
    return fail(res, '请输入用户名和密码', 40001, 400)
  }
  if (!env.jwtSecret) {
    return fail(res, '服务器未配置 JWT_SECRET', 50001, 500)
  }

  const u = String(username).toLowerCase().trim()
  if (!USERNAME_RE.test(u)) {
    return fail(res, '用户名为 3～32 位字母、数字或下划线', 40002, 400)
  }
  if (password.length < 8) {
    return fail(res, '密码至少 8 位', 40003, 400)
  }
  if (password.length > 128) {
    return fail(res, '密码过长', 40004, 400)
  }

  const dup = await User.findOne({ username: u })
  if (dup) {
    return fail(res, '用户名已被占用', 40005, 409)
  }

  const emailNorm = email ? String(email).toLowerCase().trim().slice(0, 128) : ''
  if (emailNorm) {
    const emailDup = await User.findOne({ email: emailNorm })
    if (emailDup) {
      return fail(res, '该邮箱已被注册', 40006, 409)
    }
  }

  const employeeRole = await Role.findOne({ code: 'employee' })
  if (!employeeRole) {
    return fail(
      res,
      '系统未初始化默认角色，请先执行 npm run seed 或由管理员创建 employee 角色',
      50002,
      503,
    )
  }

  const ip = req.ip || req.socket?.remoteAddress || ''
  const userAgent = req.headers['user-agent'] ?? ''

  let passwordHash
  try {
    passwordHash = await argon2.hash(password, { type: argon2.argon2id })
  } catch (e) {
    console.error(e)
    return fail(res, '密码处理失败', 50003, 500)
  }

  const display =
    displayName && String(displayName).trim()
      ? String(displayName).trim().slice(0, 64)
      : u

  const user = await User.create({
    username: u,
    displayName: display,
    email: emailNorm,
    passwordHash,
    status: 'active',
    department: '',
    orgPath: '',
  })

  await UserRole.create({ userId: user._id, roleId: employeeRole._id })

  const accessToken = jwt.sign(
    { sub: user._id.toString(), u: user.username },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  )

  const iam = await getUserWithIam(user._id)

  await appendAuditLog({
    requestId,
    actorUserId: user._id,
    actorUsername: user.username,
    action: 'auth.register',
    resourceType: 'user',
    resourceId: user._id.toString(),
    ip,
    userAgent,
    statusCode: 200,
    success: true,
    details: { roles: iam?.roles ?? [] },
  })

  return ok(res, {
    accessToken,
    expiresIn: env.jwtExpiresIn,
    user: {
      id: user._id.toString(),
      displayName: user.displayName,
      username: user.username,
      roles: iam?.roles ?? [],
      permissions: iam?.permissions ?? [],
    },
  })
})

authRouter.post('/login', async (req, res) => {
  const requestId = res.locals.requestId
  const { username, password } = req.body ?? {}
  if (!username || !password) {
    return fail(res, '请输入用户名和密码', 40001, 400)
  }
  if (!env.jwtSecret) {
    return fail(res, '服务器未配置 JWT_SECRET', 50001, 500)
  }

  const user = await User.findOne({ username: String(username).toLowerCase().trim() })
  const ip = req.ip || req.socket?.remoteAddress || ''
  const userAgent = req.headers['user-agent'] ?? ''

  if (!user || user.status !== 'active') {
    await appendAuditLog({
      requestId,
      action: 'auth.login',
      resourceType: 'user',
      resourceId: String(username),
      ip,
      userAgent,
      statusCode: 401,
      success: false,
      details: { reason: 'invalid_user_or_disabled' },
    })
    return fail(res, '用户名或密码错误', 40101, 401)
  }

  let valid = false
  try {
    valid = await argon2.verify(user.passwordHash, password)
  } catch {
    valid = false
  }
  if (!valid) {
    await appendAuditLog({
      requestId,
      actorUserId: user._id,
      actorUsername: user.username,
      action: 'auth.login',
      resourceType: 'user',
      resourceId: user._id.toString(),
      ip,
      userAgent,
      statusCode: 401,
      success: false,
      details: { reason: 'bad_password' },
    })
    return fail(res, '用户名或密码错误', 40101, 401)
  }

  user.lastLoginAt = new Date()
  await user.save()

  const accessToken = jwt.sign(
    { sub: user._id.toString(), u: user.username },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  )

  const iam = await getUserWithIam(user._id)

  await appendAuditLog({
    requestId,
    actorUserId: user._id,
    actorUsername: user.username,
    action: 'auth.login',
    resourceType: 'user',
    resourceId: user._id.toString(),
    ip,
    userAgent,
    statusCode: 200,
    success: true,
    details: { roles: iam?.roles ?? [] },
  })

  return ok(res, {
    accessToken,
    expiresIn: env.jwtExpiresIn,
    user: {
      id: user._id.toString(),
      displayName: user.displayName,
      username: user.username,
      roles: iam?.roles ?? [],
      permissions: iam?.permissions ?? [],
    },
  })
})

authRouter.get('/me', authenticate, async (req, res) => {
  const u = await User.findById(req.userId).lean()
  if (!u) return fail(res, '用户不存在', 40401, 404)
  return ok(res, {
    id: u._id.toString(),
    displayName: u.displayName,
    username: u.username,
    email: u.email,
    department: u.department,
    orgPath: u.orgPath,
    roles: req.roles,
    permissions: req.permissions,
  })
})
