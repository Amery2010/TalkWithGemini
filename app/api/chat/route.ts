import { NextResponse, type NextRequest } from 'next/server'
import { GoogleGenerativeAIStream, StreamingTextResponse } from 'ai'
import { checkToken, handleError } from '../utils'
import chat from '@/utils/chat'
import { ErrorType } from '@/constant/errors'
import { isNull } from 'lodash-es'

type GeminiRequest = {
  model: string
  messages: Message[]
  systemInstruction?: string
}

export const runtime = 'edge'

const geminiApiKey = process.env.GEMINI_API_KEY as string
const geminiApiBaseUrl = process.env.GEMINI_API_BASE_URL as string
const mode = process.env.NEXT_PUBLIC_BUILD_MODE

export async function POST(req: NextRequest) {
  if (mode === 'export') return new NextResponse('Not available under static deployment')

  const searchParams = req.nextUrl.searchParams
  const token = searchParams.get('token')

  if (isNull(token) || !checkToken(token)) {
    return NextResponse.json({ code: 40301, message: ErrorType.InValidToken }, { status: 403 })
  }
  if (!geminiApiKey) {
    return NextResponse.json({ code: 50001, message: ErrorType.NoGeminiKey }, { status: 500 })
  }

  try {
    const { messages = [], model, systemInstruction } = (await req.json()) as GeminiRequest
    const result = await chat({
      messages,
      model,
      systemInstruction,
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
