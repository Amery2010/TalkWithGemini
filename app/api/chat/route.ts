import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@fuyun/generative-ai'
import { GoogleGenerativeAIStream, StreamingTextResponse, Message } from 'ai'
import { generateSignature, generateUTCTimestamp } from '@/utils/signature'

type GeminiRequest = {
  model?: 'gemini-pro' | 'gemini-pro-vision'
  messages: Message[]
  t: number
  sign: string
}

const geminiApiKey = process.env.GEMINI_API_KEY as string
const geminiApiBaseUrl = process.env.GEMINI_API_BASE_URL as string
const password = process.env.ACCESS_PASSWORD as string

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
  const { messages = [], model = 'gemini-pro', t, sign } = (await req.json()) as GeminiRequest

  const utcTimestamp = generateUTCTimestamp()
  if (Math.abs(utcTimestamp - t) > 60000) {
    return new NextResponse('请求参数已过期', { status: 403 })
  }
  if (sign !== generateSignature(password, t)) {
    return new NextResponse('身份验证失败，请确认访问密码是否正确', { status: 403 })
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
      const messageParts = error.message.split('[400 Bad Request]')
      const errorMessage = messageParts.length > 1 ? messageParts[1].trim() : '服务端错误'
      return new NextResponse(errorMessage, { status: 500 })
    }
  }
}
