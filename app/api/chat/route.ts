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
  generationConfig: {
    topP: number
    topK: number
    temperature: number
    maxOutputTokens: number
  }
  safety: string
}

export const runtime = 'edge'
export const preferredRegion = ['cle1', 'iad1', 'pdx1', 'sfo1', 'sin1', 'syd1', 'hnd1', 'kix1']

const geminiApiKey = process.env.GEMINI_API_KEY as string
const geminiApiBaseUrl = process.env.GEMINI_API_BASE_URL as string

export async function POST(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const token = searchParams.get('token')

  if (isNull(token) || !checkToken(token)) {
    return NextResponse.json({ code: 40301, message: ErrorType.InValidToken }, { status: 403 })
  }
  if (!geminiApiKey) {
    return NextResponse.json({ code: 50001, message: ErrorType.NoGeminiKey }, { status: 500 })
  }

  try {
    const { messages = [], model, systemInstruction, generationConfig, safety } = (await req.json()) as GeminiRequest
    const result = await chat({
      messages,
      model,
      systemInstruction,
      apiKey: geminiApiKey,
      baseUrl: geminiApiBaseUrl,
      generationConfig,
      safety,
    })
    const stream = GoogleGenerativeAIStream(result)
    return new StreamingTextResponse(stream)
  } catch (error) {
    if (error instanceof Error) {
      return handleError(error.message)
    }
  }
}
