import { Router } from 'express'
import mongoose from 'mongoose'
import { Tag } from '../models/tag.js'
import { Role } from '../models/role.js'
import { authenticate, requirePermission } from '../middleware/authenticate.js'
import { ok, fail } from '../utils/apiEnvelope.js'
import { escapeRegex } from '../utils/escapeRegex.js'

export const tagsRouter = Router()

function normalizeRoleCodes(input) {
  return Array.from(
    new Set(
      (Array.isArray(input) ? input : [])
        .map((x) => String(x || '').trim().toLowerCase())
        .filter(Boolean),
    ),
  )
}

function isTagVisibleForRoles(tagDoc, roleCodes) {
  const visibleRoleCodes = Array.isArray(tagDoc?.visibleRoleCodes)
    ? tagDoc.visibleRoleCodes
    : []
  if (!visibleRoleCodes.length) return true
  const roleSet = new Set((Array.isArray(roleCodes) ? roleCodes : []).map((r) => String(r)))
  return visibleRoleCodes.some((code) => roleSet.has(String(code)))
}

tagsRouter.post('/options', authenticate, async (req, res) => {
  const tags = await Tag.find({}).sort({ name: 1 }).lean()
  const visible = tags.filter((t) => isTagVisibleForRoles(t, req.roles))
  return ok(
    res,
    visible.map((t) => ({
      name: t.name,
      color: t.color || '#2458D2',
      meaning: t.meaning || '',
    })),
  )
})

tagsRouter.post(
  '/query',
  authenticate,
  requirePermission('kb:edit'),
  async (req, res) => {
    const page = Math.max(1, Number(req.body?.page) || 1)
    const pageSize = Math.min(100, Math.max(1, Number(req.body?.pageSize) || 20))
    const q = String(req.body?.q || '').trim()
    const filter = {}
    if (q) {
      const rx = new RegExp(escapeRegex(q), 'i')
      filter.$or = [{ name: rx }, { meaning: rx }]
    }
    const total = await Tag.countDocuments(filter)
    const items = await Tag.find(filter)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean()

    return ok(res, {
      page,
      pageSize,
      total,
      items: items.map((t) => ({
        id: String(t._id),
        name: t.name,
        color: t.color || '#2458D2',
        meaning: t.meaning || '',
        visibleRoleCodes: Array.isArray(t.visibleRoleCodes) ? t.visibleRoleCodes : [],
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
    })
  },
)

tagsRouter.post(
  '/create',
  authenticate,
  requirePermission('kb:edit'),
  async (req, res) => {
    const name = String(req.body?.name || '').trim().toLowerCase()
    if (!name) return fail(res, '标签名称不能为空', 40021, 400)

    const exist = await Tag.findOne({ name }).lean()
    if (exist) return fail(res, '标签已存在', 40022, 409)

    const tag = await Tag.create({
      name,
      color: String(req.body?.color || '#2458D2').trim() || '#2458D2',
      meaning: String(req.body?.meaning || '').trim(),
      visibleRoleCodes: normalizeRoleCodes(req.body?.visibleRoleCodes),
    })

    return ok(res, { id: String(tag._id) })
  },
)

tagsRouter.post(
  '/:id/update',
  authenticate,
  requirePermission('kb:edit'),
  async (req, res) => {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      return fail(res, '无效的标签 ID', 40002, 400)
    }
    const tag = await Tag.findById(id)
    if (!tag) return fail(res, '标签不存在', 40421, 404)

    const name = String(req.body?.name || '').trim().toLowerCase()
    if (!name) return fail(res, '标签名称不能为空', 40021, 400)

    const dup = await Tag.findOne({ name, _id: { $ne: id } }).lean()
    if (dup) return fail(res, '标签名称已存在', 40022, 409)

    tag.name = name
    tag.color = String(req.body?.color || '#2458D2').trim() || '#2458D2'
    tag.meaning = String(req.body?.meaning || '').trim()
    tag.visibleRoleCodes = normalizeRoleCodes(req.body?.visibleRoleCodes)
    await tag.save()

    return ok(res, { id: String(tag._id) })
  },
)

tagsRouter.post(
  '/roles',
  authenticate,
  requirePermission('kb:edit'),
  async (_req, res) => {
    const roles = await Role.find({})
      .sort({ code: 1 })
      .lean()
    return ok(
      res,
      roles.map((r) => ({
        code: r.code,
        name: r.name,
      })),
    )
  },
)
