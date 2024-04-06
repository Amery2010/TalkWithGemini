declare interface Message {
  id: string
  role: 'user' | 'model'
  content: string
  type?: 'text' | 'image'
  error?: boolean
}

declare interface Setting {
  password: string
  apiKey: string
  apiProxy: string
  lang: string
  sttLang: string
  ttsLang: string
  ttsVoice: string
  isProtected: boolean
  talkMode: 'chat' | 'voice'
}

declare interface Topic {
  id: number
  title: string
  description: string
  parts: Omit<Message, 'id'>[]
}
