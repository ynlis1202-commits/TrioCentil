import crypto from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { requireAdmin } from '../../utils/auth'
import { checkRateLimit } from '../../utils/rateLimit'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

function detectImageExtension(buffer: Buffer): string | null {
  if (buffer.length < 12) return null
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return 'png'
  }
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpg'
  }
  // WEBP: RIFF....WEBP
  if (
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'webp'
  }
  return null
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  checkRateLimit(event, { keyPrefix: 'admin-upload', maxRequests: 30, windowMs: 10 * 60 * 1000 })

  const formData = await readMultipartFormData(event)
  const filePart = formData?.find((part) => part.name === 'file' && part.data)

  if (!filePart || !filePart.data) {
    throw createError({ statusCode: 400, statusMessage: 'File gambar tidak ditemukan.' })
  }

  if (filePart.data.length > MAX_FILE_SIZE) {
    throw createError({ statusCode: 400, statusMessage: 'Ukuran gambar maksimal 5 MB.' })
  }

  const ext = detectImageExtension(filePart.data)
  if (!ext) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Format file tidak didukung. Hanya menerima PNG, JPG, atau WEBP yang valid.'
    })
  }

  const filename = `${crypto.randomUUID()}.${ext}`
  const uploadsDir = join(process.cwd(), 'public', 'uploads')
  await mkdir(uploadsDir, { recursive: true })
  await writeFile(join(uploadsDir, filename), filePart.data)

  return {
    data: {
      url: `/uploads/${filename}`,
      filename,
      size: filePart.data.length
    }
  }
})
