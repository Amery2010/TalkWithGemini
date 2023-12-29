import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@fuyun/generative-ai'
import { GoogleGenerativeAIStream, StreamingTextResponse, Message } from 'ai'

type GeminiRequest = {
  model?: 'gemini-pro' | 'gemini-pro-vision'
  messages?: Message[]
}

const geminiApiKey = process.env.GEMINI_API_KEY as string
const geminiApiBaseUrl = process.env.GEMINI_API_BASE_URL as string

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
  const { messages = [], model = 'gemini-pro' } = (await req.json()) as GeminiRequest

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
