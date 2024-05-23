import { NextResponse } from 'next/server'
import { generateSignature, generateUTCTimestamp, decodeToken } from '@/utils/signature'

const password = (process.env.ACCESS_PASSWORD as string) || ''

export function checkToken(token: string): boolean {
  if (password !== '') {
    const { sign, ts } = decodeToken(token)
    const utcTimestamp = generateUTCTimestamp()
    if (Math.abs(utcTimestamp - ts) > 60000) {
      return false
    }
    if (sign !== generateSignature(password, ts)) {
      return false
    }
  }
  return true
}

export const handleError = (message: string) => {
  console.error(message)
  return NextResponse.json({ code: 400, message }, { status: 400 })
}
