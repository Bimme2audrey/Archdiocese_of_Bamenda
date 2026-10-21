import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { randomBytes } from 'node:crypto'

// Returns configured S3 client or null if not configured
function getS3Client(): { client: S3Client; bucket: string; publicUrl: string } | null {
  const bucket = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET || process.env.R2_BUCKET
  const accessKeyId = process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY
  const endpoint = process.env.S3_ENDPOINT // Required for Cloudflare R2 / MinIO / Wasabi
  const region = process.env.S3_REGION || process.env.AWS_REGION || 'auto'
  const publicUrl = process.env.S3_PUBLIC_URL || ''

  if (bucket && accessKeyId && secretAccessKey) {
    const client = new S3Client({
      region,
      endpoint: endpoint || undefined,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: !endpoint?.includes('amazonaws.com'),
    })
    return { client, bucket, publicUrl }
  }

  return null
}

export interface UploadResult {
  url: string
  key: string
  fileSize: string
  contentType: string
  originalName: string
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Upload a file to S3-compatible cloud storage (Cloudflare R2, AWS S3)
 * with automatic fallback to local public/uploads for development.
 */
export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  contentType: string,
  folder = 'documents'
): Promise<UploadResult> {
  const ext = originalName.includes('.') ? originalName.split('.').pop()?.toLowerCase() : 'bin'
  const randomId = randomBytes(16).toString('hex')
  const key = `${folder}/${Date.now()}-${randomId}.${ext}`
  const fileSize = formatBytes(buffer.length)

  const s3 = getS3Client()

  if (s3) {
    // Cloud S3 / Cloudflare R2 Upload
    await s3.client.send(
      new PutObjectCommand({
        Bucket: s3.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    )

    const url = s3.publicUrl
      ? `${s3.publicUrl.replace(/\/$/, '')}/${key}`
      : `https://${s3.bucket}.s3.amazonaws.com/${key}`

    return {
      url,
      key,
      fileSize,
      contentType,
      originalName,
    }
  }

  // Local filesystem fallback (stored in public/uploads for local development)
  const uploadsDir = join(process.cwd(), 'public', 'uploads', folder)
  await mkdir(uploadsDir, { recursive: true })
  const filePath = join(process.cwd(), 'public', 'uploads', key)
  await writeFile(filePath, buffer)

  return {
    url: `/uploads/${key}`,
    key,
    fileSize,
    contentType,
    originalName,
  }
}
