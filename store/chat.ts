import { create } from 'zustand'
import storage from '@/utils/Storage'
import { dataMigration } from '@/utils/migration'
import { findIndex } from 'lodash-es'

type Summary = {
  ids: string[]
  content: string
}

type MessageStore = {
  messages: Message[]
  summary: Summary
  systemInstruction: string
  init: () => Promise<Message[]>
  add: (message: Message) => void
  update: (id: string, message: Message) => void
  remove: (id: string) => void
  clear: () => void
  save: () => void
  revoke: (id: string) => void
  instruction: (prompt: string) => void
  summarize: (ids: string[], content: string) => void
}

export const useMessageStore = create<MessageStore>((set, get) => ({
  messages: [],
  summary: {
    ids: [],
    content: '',
  },
  systemInstruction: '',
  init: async () => {
    await dataMigration()
    const messages = (await storage.getItem<Message[]>('messages')) || []
    const systemInstruction = (await storage.getItem<string>('systemInstruction')) || ''
    const summary = (await storage.getItem<Summary>('summary')) || {
      ids: [],
      content: '',
    }
    set(() => ({ messages, systemInstruction, summary }))
    return messages
  },
  add: (message) => {
    set((state) => ({
      messages: [...state.messages, message],
    }))
  },
  update: (id, message) => {
    set((state) => {
      const index = findIndex(state.messages, { id })
      state.messages[index] = message
      return {
        messages: state.messages,
      }
    })
  },
  remove: (id) => {
    set((state) => {
      const index = findIndex(state.messages, { id })
      const messages = [...state.messages]
      messages.splice(index, 1)
      return { messages }
    })
    get().save()
  },
  clear: () => {
    set(() => ({
      messages: [],
      summary: {
        ids: [],
        content: '',
      },
    }))
    storage.setItem<Message[]>('messages', [])
    storage.setItem<Summary>('summary', {
      ids: [],
      content: '',
    })
  },
  save: () => {
    storage.setItem<Message[]>('messages', get().messages)
  },
  revoke: (id) => {
    set((state) => {
      const index = findIndex(state.messages, { id })
      const messages = [...state.messages]
      return { messages: messages.slice(0, index) }
    })
    get().save()
  },
  instruction: (prompt) => {
    set(() => ({ systemInstruction: prompt }))
    storage.setItem<string>('systemInstruction', prompt)
  },
  summarize: (ids, content) => {
    set(() => ({
      summary: {
        ids,
        content,
      },
    }))
    storage.setItem<Summary>('summary', get().summary)
  },
}))
