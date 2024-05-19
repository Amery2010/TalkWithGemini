import { HmacSHA256 } from 'crypto-js'

// Generate signature
export function generateSignature(key: string, timestamp: number): string {
  const data = `${key}:${timestamp}`
  const signature = HmacSHA256(data, key).toString()
  return signature
}

// Verify signature
export function verifySignature(key: string, timestamp: number, signature: string): boolean {
  const generatedSignature = generateSignature(key, timestamp)
  return signature === generatedSignature
}

// Generate UTC timestamp
export function generateUTCTimestamp(): number {
  const timestamp = Math.floor(Date.now() / 1000) // 转换为秒级时间戳
  const utcTimestamp = new Date(timestamp * 1000).toISOString()
  return new Date(utcTimestamp).getTime()
}

export function encodeBase64(text: string): string {
  return Buffer.from(text, 'utf-8').toString('base64')
}

export function decodeBase64(base64: string): string {
  return Buffer.from(base64, 'base64').toString('utf-8')
}

export function encodeToken(password: string): string {
  const utcTimestamp = generateUTCTimestamp()
  return encodeBase64(`${generateSignature(password, utcTimestamp)}@${utcTimestamp}`)
}

export function decodeToken(token: string) {
  const [sign, ts] = decodeBase64(token).split('@')
  return { sign, ts: Number(ts) }
}
