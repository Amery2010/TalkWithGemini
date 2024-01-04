declare interface Message {
  id?: string
  role: 'user' | 'model'
  content: string
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
}

declare interface Topic {
  id: number
  title: string
  description: string
  parts: Message[]
}
