import { Router } from 'express'
import mongoose from 'mongoose'
import { AuditLog } from '../models/auditLog.js'
import { authenticate, requirePermission } from '../middleware/authenticate.js'
import { ok, fail } from '../utils/apiEnvelope.js'

export const auditRouter = Router()

function buildListFilter(query) {
  const {
    actor,
    action,
    resourceType,
    requestId,
    success,
    startAt,
    endAt,
  } = query

  const filter = {}

  if (actor && String(actor).trim()) {
    filter.actorUsername = new RegExp(String(actor).trim(), 'i')
  }

  if (action && String(action).trim()) {
    filter.action = String(action).trim()
  }

  if (resourceType && String(resourceType).trim()) {
    filter.resourceType = String(resourceType).trim()
  }

  if (requestId && String(requestId).trim()) {
    filter.requestId = String(requestId).trim()
  }

  if (success === 'true') {
    filter.success = true
  } else if (success === 'false') {
    filter.success = false
  }

  if ((startAt && String(startAt).trim()) || (endAt && String(endAt).trim())) {
    filter.createdAt = {}
    if (startAt && String(startAt).trim()) {
      const d = new Date(String(startAt))
      if (!Number.isNaN(d.valueOf())) {
        filter.createdAt.$gte = d
      }
    }
    if (endAt && String(endAt).trim()) {
      const d = new Date(String(endAt))
      if (!Number.isNaN(d.valueOf())) {
        filter.createdAt.$lte = d
      }
    }
    if (Object.keys(filter.createdAt).length === 0) {
      delete filter.createdAt
    }
  }

  return filter
}

auditRouter.post(
  '/logs',
  authenticate,
  requirePermission('audit:read'),
  async (req, res) => {
    const page = Math.max(1, Number(req.body?.page) || 1)
    const pageSize = Math.min(100, Math.max(1, Number(req.body?.pageSize) || 20))
    const filter = buildListFilter(req.body ?? {})

    const total = await AuditLog.countDocuments(filter)
    const items = await AuditLog.find(filter)
      .sort({ createdAt: -1, seq: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean()

    return ok(res, {
      page,
      pageSize,
      total,
      items: items.map((x) => ({
        id: String(x._id),
        seq: x.seq,
        occurredAt: x.createdAt,
        action: x.action,
        actorUsername: x.actorUsername,
        resourceType: x.resourceType,
        resourceId: x.resourceId,
        success: x.success,
        statusCode: x.statusCode ?? null,
        requestId: x.requestId,
      })),
    })
  },
)

auditRouter.post(
  '/logs/:id',
  authenticate,
  requirePermission('audit:read'),
  async (req, res) => {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      return fail(res, '无效的审计日志 ID', 40002, 400)
    }

    const row = await AuditLog.findById(id).lean()
    if (!row) {
      return fail(res, '审计日志不存在', 40402, 404)
    }

    return ok(res, {
      id: String(row._id),
      seq: row.seq,
      occurredAt: row.createdAt,
      action: row.action,
      actorUserId: row.actorUserId ? String(row.actorUserId) : null,
      actorUsername: row.actorUsername,
      resourceType: row.resourceType,
      resourceId: row.resourceId,
      ip: row.ip,
      userAgent: row.userAgent,
      requestId: row.requestId,
      statusCode: row.statusCode ?? null,
      success: row.success,
      details: row.details ?? {},
      prevHash: row.prevHash,
      recordHash: row.recordHash,
    })
  },
)
