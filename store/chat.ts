import { create } from 'zustand'
import type { Part } from '@google/generative-ai'
import storage from '@/utils/Storage'
import { findIndex, isUndefined } from 'lodash-es'

type Summary = {
  ids: string[]
  content: string
}

type OldMessage = {
  id: string
  role: string
  content: string
  parts: never
}

type MessageStore = {
  messages: Message[]
  summary: Summary
  systemInstruction: string
  init: () => Message[]
  add: (message: Message) => void
  update: (id: string, message: Message) => void
  replace: (id: string, message: Message) => void
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
  init: () => {
    const messages = storage.get<Message[] | OldMessage[]>('messages') || []
    const systemInstruction = storage.get<string>('systemInstruction') || ''
    const summary = storage.get<Summary>('summary') || {
      ids: [],
      content: '',
    }
    // Convert old data format to new data format
    if (messages.length > 0 && isUndefined(messages[0].parts)) {
      const newMessages: Message[] = (messages as OldMessage[]).map((item) => {
        if (item.content.startsWith('data:image/')) {
          const dataArr = item.content.split(';base64,')
          return {
            id: item.id,
            role: item.role,
            parts: [
              {
                inlineData: { data: dataArr[1], mimeType: dataArr[0].substring(5) },
              },
            ],
          }
        } else {
          return {
            id: item.id,
            role: item.role,
            parts: [
              {
                text: item.content,
              },
            ],
          }
        }
      })
      set(() => ({ messages: newMessages, summary }))
    } else {
      set(() => ({ messages, systemInstruction, summary }))
    }
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
  instruction: (prompt) => {
    set(() => ({ systemInstruction: prompt }))
    storage.set<string>('systemInstruction', prompt)
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
