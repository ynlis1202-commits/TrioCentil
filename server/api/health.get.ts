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
  } catch {
    setResponseStatus(event, 503)
    return {
      status: 'degraded',
      database: 'disconnected',
      message: 'Koneksi database TiDB Cloud belum tersedia.',
      timestamp: new Date().toISOString()
    }
  }
})
