import { HmacSHA256 } from 'crypto-js'

// 生成签名
export function generateSignature(key: string, timestamp: number): string {
  const data = `${key}:${timestamp}`
  const signature = HmacSHA256(data, key).toString()
  return signature
}

// 验证签名
export function verifySignature(key: string, timestamp: number, signature: string): boolean {
  const generatedSignature = generateSignature(key, timestamp)
  return signature === generatedSignature
}

// 生成 UTC 时间戳
export function generateUTCTimestamp(): number {
  const timestamp = Math.floor(Date.now() / 1000) // 转换为秒级时间戳
  const utcTimestamp = new Date(timestamp * 1000).toISOString()
  return new Date(utcTimestamp).getTime()
}
