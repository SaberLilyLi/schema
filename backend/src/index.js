import './models/index.js'
import { createApp } from './app.js'
import { env } from './config/env.js'
import { connectMongo, disconnectMongo } from './db/mongoose.js'

async function main() {
  if (!env.mongodbUri) {
    console.error('[mongo] 请在 backend 目录下的 .env 中配置 MONGODB_URI')
    process.exit(1)
  }

  await connectMongo(env.mongodbUri)

  const app = createApp()
  const server = app.listen(env.port, () => {
    console.log(`[http] http://localhost:${env.port}`)
  })

  const shutdown = async () => {
    server.close()
    await disconnectMongo()
    console.log('[mongo] 已断开')
    process.exit(0)
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
