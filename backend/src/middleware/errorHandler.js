import { randomUUID } from 'node:crypto'

/** @type {import('express').ErrorRequestHandler} */
export const errorHandler = (err, req, res, _next) => {
  const status = typeof err.status === 'number' ? err.status : 500
  const message = err instanceof Error ? err.message : '服务器错误'
  const requestId = res.locals?.requestId ?? randomUUID()
  const code = status === 500 ? 50000 : status
  console.error(err)
  res.status(status).json({ code, message, requestId, data: null })
}
