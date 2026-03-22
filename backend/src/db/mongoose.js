import mongoose from 'mongoose'

export async function connectMongo(uri) {
  mongoose.set('strictQuery', true)
  await mongoose.connect(uri)
  const dbName = mongoose.connection.db?.databaseName
  console.log(`[mongo] 已连接，数据库: ${dbName ?? '?'}`)
}

export async function disconnectMongo() {
  await mongoose.disconnect()
}
