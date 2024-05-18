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

export function encodeToken(password: string): string {
  const utcTimestamp = generateUTCTimestamp()
  return btoa(`${generateSignature(password, utcTimestamp)}@${utcTimestamp}`)
}

export function decodeToken(token: string) {
  const [sign, ts] = atob(token).split('@')
  return { sign, ts: Number(ts) }
}
