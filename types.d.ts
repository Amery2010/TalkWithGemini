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

  interface Agent {
    author: string
    createAt: string
    homepage: string
    identifier: string
    meta: {
      avatar: string
      tags: string[]
      title: string
      description: string
    }
    schemaVersion: number
  }

  interface AgentDetail extends Agent {
    config: {
      systemRole: string
    }
  }
}
