import cors from 'cors'
import express from 'express'
import { apiRouter } from './routes/index.js'
import { errorHandler } from './middleware/errorHandler.js'
import { requestIdMiddleware } from './middleware/requestId.js'

export function createApp() {
  const app = express()
  app.use(cors())
  app.use(express.json({ limit: '10mb' }))
  app.use(requestIdMiddleware)
  app.use('/api', apiRouter)
  app.use(errorHandler)
  return app
}
