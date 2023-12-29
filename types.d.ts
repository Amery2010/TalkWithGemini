declare interface Message {
  id?: string
  role: 'user' | 'model'
  content: string
  error?: boolean
}
