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

export default function chat({ messages = [], model = 'gemini-pro', apiKey, baseUrl }: RequestProps) {
  const genAI = new GoogleGenerativeAI(apiKey, baseUrl)
  const geminiModel = genAI.getGenerativeModel({ model })

  const message = messages.pop()
  if (isUndefined(message)) {
    throw new Error('Request parameter error')
  }
  if (model === 'gemini-pro-vision') {
    const textMessages: Message[] = []
    const imageMessage: Message[] = []
    messages.forEach((item) => {
      if (item.type === 'image') {
        imageMessage.push(item)
      } else {
        textMessages.push(item)
      }
    })
    const conversation = `
      The following conversation is my question about those pictures and your explanation:
      """
      ${textMessages
        .map((item) => {
          return `${item.role === 'user' ? 'Question' : 'Answer'}: ${item.content}`
        })
        .join('\n')}
      """
      Just remember the conversation and do not include the above when answering!
    `
    const content = `
      Please answer my question in the language I asked it in:
      """
      ${message.content}
      """
    `
    const prompt = textMessages.length > 0 ? conversation + content : content
    const imageDataList = imageMessage.map((item) => {
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
