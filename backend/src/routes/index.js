import { Router } from 'express'
import { healthRouter } from './health.js'
import { authRouter } from './auth.js'
import { articlesRouter } from './articles.js'
import { auditRouter } from './audit.js'

export const apiRouter = Router()

apiRouter.use('/health', healthRouter)
apiRouter.use('/auth', authRouter)
apiRouter.use('/articles', articlesRouter)
apiRouter.use('/audit', auditRouter)
