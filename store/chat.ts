import { create } from 'zustand'
import storage from '@/utils/Storage'
import { findIndex } from 'lodash-es'

type MessageStore = {
  messages: Message[]
  init: () => Message[]
  add: (message: Message) => void
  update: (id: string, content: string) => void
  replace: (id: string, message: Message) => void
  clear: () => void
  save: () => void
  revoke: (id: string) => void
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
  update: (id, content) => {
    set((state) => {
      const index = findIndex(state.messages, { id })
      state.messages[index].content += content
      return {
        messages: state.messages,
      }
    })
  },
  replace: (id, message) => {
    set((state) => {
      const index = findIndex(state.messages, { id })
      state.messages[index] = message
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
  revoke: (id) => {
    set((state) => {
      const index = findIndex(state.messages, { id })
      return { messages: state.messages.slice(0, index) }
    })
  },
}))
