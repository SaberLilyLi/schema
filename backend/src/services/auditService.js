import { createHash } from 'node:crypto'
import { AuditLog } from '../models/auditLog.js'
import { getNextSequence } from '../models/counter.js'

const GENESIS_PREV = '0'.repeat(64)

export async function appendAuditLog({
  requestId,
  actorUserId,
  actorUsername = '',
  action,
  resourceType = '',
  resourceId = '',
  ip = '',
  userAgent = '',
  statusCode,
  success = true,
  details = {},
}) {
  const seq = await getNextSequence('audit')
  const last = await AuditLog.findOne().sort({ seq: -1 }).lean()
  const prevHash = last?.recordHash ?? GENESIS_PREV

  const signedPayload = JSON.stringify({
    seq,
    action,
    resourceId: resourceId ?? '',
    requestId: requestId ?? '',
    success,
  })
  const recordHash = createHash('sha256')
    .update(prevHash + signedPayload, 'utf8')
    .digest('hex')

  await AuditLog.create({
    seq,
    requestId,
    actorUserId,
    actorUsername,
    action,
    resourceType,
    resourceId,
    ip,
    userAgent,
    statusCode,
    success,
    details,
    prevHash,
    recordHash,
  })

  return { seq, recordHash }
}
