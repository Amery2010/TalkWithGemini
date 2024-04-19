import { GoogleGenerativeAI } from '@fuyun/generative-ai'
import { generationConfig, safetySettings } from '@/constant/modelSettings'
import { getVisionPrompt } from '@/utils/prompt'
import { isUndefined, groupBy } from 'lodash-es'

export type RequestProps = {
  model?: 'gemini-pro' | 'gemini-pro-vision'
  messages: Pick<Message, 'role' | 'content' | 'type'>[]
  apiKey: string
  baseUrl?: string
}

function transformMessage(message: Pick<Message, 'role' | 'content' | 'type'>) {
  return {
    role: message.role === 'user' ? 'user' : 'model',
    parts: [
      {
        text: message.content,
      },
    ],
  }
}

export default function chat({ messages = [], model = 'gemini-pro', apiKey, baseUrl }: RequestProps) {
  const genAI = new GoogleGenerativeAI(apiKey, baseUrl)
  const geminiModel = genAI.getGenerativeModel({ model })

  const message = messages.pop()
  if (isUndefined(message)) {
    throw new Error('Request parameter error')
  }
  if (model === 'gemini-pro-vision') {
    const messageGroup = groupBy(messages, 'type')
    const prompt = getVisionPrompt(message, messageGroup.text || [])
    const imageDataList = messageGroup.image.map((item) => {
      const data = item.content.split(';base64,')
      return {
        inlineData: {
          data: data[1],
          mimeType: data[0].substring(5),
        },
      }
    })
    if (imageDataList.length > 10) {
      throw new Error('Limited to 10 pictures')
    }
    return geminiModel.generateContentStream([prompt, ...imageDataList.reverse()])
  } else {
    const chat = geminiModel.startChat({
      history: messages.map((msg) => transformMessage(msg)),
      generationConfig,
      safetySettings,
    })
    return chat.sendMessageStream(message.content)
  }
}
