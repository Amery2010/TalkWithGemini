import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@fuyun/generative-ai'
import { GoogleGenerativeAIStream, StreamingTextResponse, Message } from 'ai'
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
const password = (process.env.ACCESS_PASSWORD as string) || ''

function transformMessage(message: Message) {
  return {
    role: message.role === 'user' ? 'user' : 'model',
    parts: [
      {
        text: message.content,
      },
    ],
  }
}

export async function POST(req: Request) {
  const { messages = [], model = 'gemini-pro', ts, sign } = (await req.json()) as GeminiRequest

  if (password) {
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

  try {
    const genAI = new GoogleGenerativeAI(geminiApiKey, geminiApiBaseUrl)
    const geminiModel = genAI.getGenerativeModel({ model })

    const history = messages.length > 1 ? messages.slice(0, -1) : []
    const chat = geminiModel.startChat({
      history: history.map((msg) => transformMessage(msg)),
      generationConfig: {
        maxOutputTokens: 2000,
      },
    })

    const newMessage = transformMessage(messages[messages.length - 1])
      .parts.map((part) => part.text)
      .join('')
    const result = await chat.sendMessageStream(newMessage)
    const stream = GoogleGenerativeAIStream(result)
    return new StreamingTextResponse(stream)
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message)
      const messageParts = error.message.split('[400 Bad Request]')
      const errorMessage = messageParts.length > 1 ? messageParts[1].trim() : 'Server error'
      return NextResponse.json({ code: 50001, message: errorMessage }, { status: 500 })
    }
  }
}
