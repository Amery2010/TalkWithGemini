import { GoogleGenerativeAI, type InlineDataPart, type Content } from '@google/generative-ai'
import { getVisionPrompt } from '@/utils/prompt'
import { Model } from '@/constant/model'
import { isUndefined, pick } from 'lodash-es'

import { HarmCategory, HarmBlockThreshold } from '@google/generative-ai'

export const generationConfig = {
  // maxOutputTokens: 4000,
  temperature: 0.6,
  topP: 0.8,
  // topK: 16,
}

export const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
]

export type RequestProps = {
  model?: string
  systemInstruction?: string
  messages: Message[]
  apiKey: string
  baseUrl?: string
}

export default function chat({
  messages = [],
  systemInstruction,
  model = Model.GeminiPro,
  apiKey,
  baseUrl,
}: RequestProps) {
  const genAI = new GoogleGenerativeAI(apiKey)
  const geminiModel = genAI.getGenerativeModel(
    { model, generationConfig, safetySettings, systemInstruction },
    { baseUrl },
  )
  const message = messages.pop()
  if (isUndefined(message)) {
    throw new Error('Request parameter error')
  }
  if (model === Model.GeminiProVision) {
    const textMessages: Message[] = []
    const imageMessages: InlineDataPart[] = []
    for (const item of messages) {
      for (const part of item.parts) {
        if (part.text) {
          textMessages.push(item)
        } else if (part.inlineData?.mimeType.startsWith('image/')) {
          imageMessages.push(part)
        }
      }
    }
    const prompt = getVisionPrompt(message, textMessages)
    if (imageMessages.length > 10) {
      throw new Error('Limited to 10 pictures')
    }
    return geminiModel.generateContentStream([prompt, ...imageMessages.reverse()])
  } else {
    const chat = geminiModel.startChat({
      history: messages.map((item) => pick(item, ['role', 'parts'])),
    })
    return chat.sendMessageStream(message.parts)
  }
}
