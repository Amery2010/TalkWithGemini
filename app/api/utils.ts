import { NextResponse } from 'next/server'
import { generateSignature, generateUTCTimestamp, decodeToken } from '@/utils/signature'
import { ErrorType } from '@/constant/errors'

const isProtected = (process.env.NEXT_PUBLIC_ENABLE_PROTECT as string) === '1'
const password = (process.env.ACCESS_PASSWORD as string) || ''

export function checkToken(token: string) {
  if (isProtected && password !== '') {
    const { sign, ts } = decodeToken(token)
    const utcTimestamp = generateUTCTimestamp()
    if (Math.abs(utcTimestamp - ts) > 60000) {
      return false
    }
    if (sign !== generateSignature(password, ts)) {
      return false
    }
    return true
  }
}

export const handleError = (message: string) => {
  console.error(message)
  const messageParts = message.split('[400 Bad Request]')
  const errorMessage = messageParts.length > 1 ? messageParts[1].trim() : ErrorType.ServerError
  return NextResponse.json({ code: 400, message: errorMessage }, { status: 400 })
}
