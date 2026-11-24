import { prisma } from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    return {
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
      timezone: 'Asia/Jakarta'
    }
  } catch (err: any) {
    setResponseStatus(event, 503)
    return {
      status: 'degraded',
      database: 'disconnected',
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      errorCode: err?.code || err?.name || 'DB_ERROR',
      message: 'Koneksi database TiDB Cloud belum tersedia.',
      timestamp: new Date().toISOString()
    }
  }
})
