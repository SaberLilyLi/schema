import { randomUUID } from 'node:crypto'

export function ok(res, data, message = 'OK', code = 0) {
  const requestId = res.locals.requestId ?? randomUUID()
  return res.json({ code, message, requestId, data })
}

export function fail(res, message, code = 1, status = 400) {
  const requestId = res.locals.requestId ?? randomUUID()
  return res.status(status).json({ code, message, requestId, data: null })
}
