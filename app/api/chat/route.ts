import { NextResponse } from 'next/server'
import { GoogleGenerativeAIStream, StreamingTextResponse } from 'ai'
import chat from '@/utils/chat'
import { generateSignature, generateUTCTimestamp } from '@/utils/signature'

type GeminiRequest = {
  model?: 'gemini-pro' | 'gemini-pro-vision'
  messages: Message[]
  ts: number
  sign: string
}

export const runtime = 'edge'

const geminiApiKey = process.env.GEMINI_API_KEY as string
const geminiApiBaseUrl = process.env.GEMINI_API_BASE_URL as string
const isProtected = (process.env.NEXT_PUBLIC_ENABLE_PROTECT as string) === '1'
const password = (process.env.ACCESS_PASSWORD as string) || ''

export async function POST(req: Request) {
  const { messages = [], model = 'gemini-pro', ts, sign } = (await req.json()) as GeminiRequest

  if (isProtected && password !== '') {
    const utcTimestamp = generateUTCTimestamp()
    if (Math.abs(utcTimestamp - ts) > 60000) {
      return NextResponse.json({ code: 40301, message: 'Request parameters have expired' }, { status: 403 })
    }
    if (sign !== generateSignature(password, ts)) {
      return NextResponse.json(
        { code: 40302, message: 'Authentication failed, please confirm whether the access password is correct' },
        { status: 403 },
      )
    }
  }

  if (!geminiApiKey) {
    return NextResponse.json({ code: 50002, message: 'The server Gemini key is missing' }, { status: 500 })
  }

  const handleError = (message: string) => {
    const messageParts = message.split('[400 Bad Request]')
    const errorMessage = messageParts.length > 1 ? messageParts[1].trim() : 'Unknown error'
    return NextResponse.json({ code: 400, message: errorMessage }, { status: 400 })
  }

  try {
    const result = await chat({
      messages,
      model,
      apiKey: geminiApiKey,
      baseUrl: geminiApiBaseUrl,
    })
    const stream = GoogleGenerativeAIStream(result)
    return new StreamingTextResponse(stream)
  } catch (error) {
    if (error instanceof Error) {
      return handleError(error.message)
    }
  }
}
