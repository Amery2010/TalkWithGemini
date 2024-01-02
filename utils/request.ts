import { GoogleGenerativeAI } from '@fuyun/generative-ai'

export type RequestProps = {
  model?: 'gemini-pro' | 'gemini-pro-vision'
  messages?: Message[]
  key: string
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

export async function chat({ messages = [], model = 'gemini-pro', key, baseUrl }: RequestProps) {
  try {
    const genAI = new GoogleGenerativeAI(key, baseUrl)
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
    return result.stream
  } catch (error) {
    if (error instanceof Error) {
      return error.message
    } else {
      return '未知错误'
    }
  }
}
