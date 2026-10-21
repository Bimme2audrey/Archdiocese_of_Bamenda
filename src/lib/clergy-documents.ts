export interface UploadedClergyDocument {
  name: string
  type?: string
  uploadDate?: string
  fileSize?: string
  originalName?: string | null
  contentType?: string | null
  fileUrl?: string | null
  contentData?: string | null
}

export function isUploadedClergyDocumentList(value: unknown): value is UploadedClergyDocument[] {
  if (!Array.isArray(value)) return false

  return value.every((entry: unknown) => {
    if (!entry || typeof entry !== 'object') return false
    const contentData = 'contentData' in entry ? entry.contentData : undefined
    if (contentData === undefined || contentData === null || contentData === '') return true
    return typeof contentData === 'string' &&
      contentData.length <= 5_600_000 &&
      /^data:(application\/pdf|image\/(jpeg|png|webp));base64,/.test(contentData)
  })
}
