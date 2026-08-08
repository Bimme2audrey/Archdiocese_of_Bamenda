import { createHash, randomBytes } from 'crypto'

export function sha256(text: string): string {
  return createHash('sha256').update(text).digest('hex')
}

export function generateCodeHash(code: string): string {
  // Add pepper from env for extra security
  const pepper = process.env.IT_CODE_PEPPER || 'adp-clergy-pepper'
  return sha256(`${code}::${pepper}`)
}

export function generateResetCode(): string {
  return randomBytes(4).toString('hex').toUpperCase().slice(0, 8)
}
