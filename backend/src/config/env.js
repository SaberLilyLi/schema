import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
/** 始终从 backend 根目录加载 .env，避免在 backend/src 等子目录启动时读不到变量 */
const envPath = path.resolve(__dirname, '..', '..', '.env')
const result = dotenv.config({ path: envPath })
if (result.error && process.env.NODE_ENV !== 'test') {
  console.warn(
    `[env] 未加载 ${envPath}（${result.error.message}）。若需本地配置，请在 backend 目录放置 .env。`,
  )
}

export const env = {
  port: Number(process.env.PORT) || 5000,
  mongodbUri: (process.env.MONGODB_URI ?? '').trim(),
  jwtSecret: (process.env.JWT_SECRET ?? '').trim(),
  jwtExpiresIn: (process.env.JWT_EXPIRES_IN ?? '7d').trim() || '7d',
}
