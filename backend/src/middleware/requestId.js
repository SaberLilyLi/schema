import { randomUUID } from 'node:crypto'

export function requestIdMiddleware(req, res, next) {
  const fromHeader = req.headers['x-request-id']
  res.locals.requestId =
    typeof fromHeader === 'string' && fromHeader.length > 0
      ? fromHeader
      : randomUUID()
  next()
}
