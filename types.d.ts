import type { Content } from '@google/generative-ai'

declare global {
  interface Message extends Content {
    id: string
  }

  interface Setting {
    password: string
    apiKey: string
    apiProxy: string
    lang: string
    sttLang: string
    ttsLang: string
    ttsVoice: string
    isProtected: boolean
    talkMode: 'chat' | 'voice'
    maxHistoryLength: number
  }

  interface Topic {
    id: number
    title: string
    description: string
    parts: Omit<Message, 'id'>[]
  }
}
