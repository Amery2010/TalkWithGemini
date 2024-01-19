import { GoogleGenerativeAI } from '@fuyun/generative-ai'
import { generationConfig, safetySettings } from '@/constant/modelSettings'
import { isUndefined } from 'lodash-es'

export type RequestProps = {
  model?: 'gemini-pro' | 'gemini-pro-vision'
  messages: Message[]
  apiKey: string
  baseUrl?: string
}

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

export function chat({ messages = [], model = 'gemini-pro', apiKey, baseUrl }: RequestProps) {
  const genAI = new GoogleGenerativeAI(apiKey, baseUrl)
  const geminiModel = genAI.getGenerativeModel({ model })

  const message = messages.pop()
  if (isUndefined(message)) throw new Error('Request parameter error')
  const chat = geminiModel.startChat({
    history: messages.map((msg) => transformMessage(msg)),
    generationConfig,
    safetySettings,
  })
  return chat.sendMessageStream(message.content)
}
