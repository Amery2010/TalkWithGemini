import { create } from 'zustand'
import storage from '@/utils/Storage'
import { findIndex } from 'lodash-es'

type Summary = {
  ids: string[]
  content: string
}

type MessageStore = {
  messages: Message[]
  summary: Summary
  init: () => Message[]
  add: (message: Message) => void
  update: (id: string, content: string) => void
  replace: (id: string, message: Message) => void
  clear: () => void
  save: () => void
  revoke: (id: string) => void
  summarize: (ids: string[], content: string) => void
}

export const useMessageStore = create<MessageStore>((set, get) => ({
  messages: [],
  summary: {
    ids: [],
    content: '',
  },
  init: () => {
    const messages = storage.get<Message[]>('messages') || []
    const summary = storage.get<Summary>('summary') || {
      ids: [],
      content: '',
    }
    set(() => ({ messages, summary }))
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
    set(() => ({
      messages: [],
      summary: {
        ids: [],
        content: '',
      },
    }))
    storage.set<Message[]>('messages', [])
    storage.set<Summary>('summary', {
      ids: [],
      content: '',
    })
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
  summarize: (ids, content) => {
    set(() => ({
      summary: {
        ids,
        content,
      },
    }))
    storage.set<Summary>('summary', get().summary)
  },
}))
