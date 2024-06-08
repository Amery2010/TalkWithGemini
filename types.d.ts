import type { Content } from '@google/generative-ai'

declare global {
  interface Message extends Content {
    id: string
    attachments?: FileInfor[]
  }

  interface Setting {
    password: string
    apiKey: string
    apiProxy: string
    model: string
    lang: string
    sttLang: string
    ttsLang: string
    ttsVoice: string
    isProtected: boolean
    talkMode: 'chat' | 'voice'
    maxHistoryLength: number
    assistantIndexUrl: string
    uploadProxy: string
    topP: number
    topK: number
    temperature: number
    maxOutputTokens: number
    safety: string
    autoStopRecord: boolean
  }

  interface Assistant {
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

  interface AssistantDetail extends Assistant {
    config: {
      systemRole: string
    }
  }

  interface FileMetadata {
    name: string
    displayName?: string
    mimeType: string
    sizeBytes: string
    createTime: string
    updateTime: string
    expirationTime: string
    sha256Hash: string
    uri: string
    state: 'STATE_UNSPECIFIED' | 'PROCESSING' | 'ACTIVE' | 'FAILED'
  }

  interface FileInfor {
    id: string
    name: string
    mimeType: string
    size: number
    preview?: string
    metadata?: FileMetadata
    status: 'STATE_UNSPECIFIED' | 'PROCESSING' | 'ACTIVE' | 'FAILED'
  }
}
