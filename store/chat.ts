import { create } from 'zustand'
import storage from '@/utils/Storage'

type MessageStore = {
  messages: Message[]
  init: () => Message[]
  add: (message: Message) => void
  update: (content: string) => void
  clear: () => void
  save: () => void
  revoke: () => void
}

export const useMessageStore = create<MessageStore>((set, get) => ({
  messages: [],
  init: () => {
    const messages: Message[] = storage.get<Message[]>('messages') || []
    set(() => ({ messages }))
    return messages
  },
  add: (message) => {
    set((state) => ({
      messages: [...state.messages, message],
    }))
  },
  update: (content) => {
    set((state) => {
      state.messages[state.messages.length - 1].content += content
      return {
        messages: state.messages,
      }
    })
  },
  clear: () => {
    set(() => ({ messages: [] }))
    storage.set<Message[]>('messages', [])
  },
  save: () => {
    storage.set<Message[]>('messages', get().messages)
  },
  revoke: () => {
    set((state) => ({ messages: state.messages.slice(0, state.messages.length - 2) }))
  },
}))
