import { GoogleGenerativeAI, type InlineDataPart, type ModelParams } from '@google/generative-ai'
import { getVisionPrompt } from '@/utils/prompt'
import { Model } from '@/constant/model'
import { isUndefined, pick } from 'lodash-es'

import { HarmCategory, HarmBlockThreshold } from '@google/generative-ai'

export const generationConfig = {
  // maxOutputTokens: 4000,
  // temperature: 0.6,
  // topP: 0.8,
  // topK: 16,
}

export const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
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
  model = Model['Gemini Pro'],
  apiKey,
  baseUrl,
}: RequestProps) {
  const genAI = new GoogleGenerativeAI(apiKey)
  const modelParams: ModelParams = { model, generationConfig, safetySettings }
  if (systemInstruction) {
    if (model.startsWith('gemini-1.5')) {
      modelParams.systemInstruction = systemInstruction
    } else {
      const systemInstructionMessages = [
        { id: 'systemInstruction', role: 'user', parts: [{ text: systemInstruction }] },
        { id: 'systemInstruction2', role: 'model', parts: [{ text: 'ok' }] },
      ]
      messages = [...systemInstructionMessages, ...messages]
    }
  }
  const geminiModel = genAI.getGenerativeModel(modelParams, { baseUrl })
  const message = messages.pop()
  if (isUndefined(message)) {
    throw new Error('Request parameter error')
  }
  if (['gemini-1.0-pro-vision', 'gemini-1.0-pro-vision-latest', 'gemini-pro-vision'].includes(model as Model)) {
    const textMessages: Message[] = []
    const imageMessages: InlineDataPart[] = message.parts.filter((part) =>
      part.inlineData?.mimeType.startsWith('image/'),
    ) as InlineDataPart[]
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
    if (imageMessages.length > 16) {
      throw new Error('Limited to 16 pictures')
    }
    return geminiModel.generateContentStream([prompt, ...imageMessages])
  } else {
    const chat = geminiModel.startChat({
      history: messages.map((item) => pick(item, ['role', 'parts'])),
    })
    return chat.sendMessageStream(message.parts)
  }
}
