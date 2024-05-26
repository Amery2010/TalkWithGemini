import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'
import type { InlineDataPart, ModelParams } from '@google/generative-ai'
import { getVisionPrompt } from '@/utils/prompt'
import { Model, OldVisionModel } from '@/constant/model'
import { isUndefined, pick, values } from 'lodash-es'

export type RequestProps = {
  model?: string
  systemInstruction?: string
  messages: Message[]
  apiKey: string
  baseUrl?: string
  generationConfig: {
    topP: number
    topK: number
    temperature: number
    maxOutputTokens: number
  }
  safety: string
}

function getSafetySettings(level: string) {
  let threshold: HarmBlockThreshold
  switch (level) {
    case 'none':
      threshold = HarmBlockThreshold.BLOCK_NONE
      break
    case 'low':
      threshold = HarmBlockThreshold.BLOCK_LOW_AND_ABOVE
      break
    case 'middle':
      threshold = HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
      break
    case 'high':
      threshold = HarmBlockThreshold.BLOCK_ONLY_HIGH
      break
    default:
      threshold = HarmBlockThreshold.HARM_BLOCK_THRESHOLD_UNSPECIFIED
      break
  }
  return [
    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    HarmCategory.HARM_CATEGORY_HARASSMENT,
    HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
  ].map((category) => {
    return { category, threshold }
  })
}

export default function chat({
  messages = [],
  systemInstruction,
  model = Model['Gemini Pro'],
  apiKey,
  baseUrl,
  generationConfig,
  safety,
}: RequestProps) {
  const genAI = new GoogleGenerativeAI(apiKey)
  const modelParams: ModelParams = { model, generationConfig, safetySettings: getSafetySettings(safety) }
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
  if (OldVisionModel.includes(model as Model)) {
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
