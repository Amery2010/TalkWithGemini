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
  sttLang: string
  ttsLang: string
  ttsVoice: string
}
