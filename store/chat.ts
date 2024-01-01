import { create } from 'zustand'
import Storage from '@/utils/Storage'

type MessageStore = {
  messages: Message[]
  init: () => void
  add: (message: Message) => void
  update: (content: string) => void
  reset: () => void
  save: () => void
  revoke: () => void
}

const DEFAULT_MESSAGE: Message[] = [
  {
    id: '1',
    role: 'user',
    content: '你是我身边一位无所不知的朋友，我需要你用口语的方式与我沟通，并在适当的位置换行。',
  },
  {
    id: '2',
    role: 'model',
    content: '好的，我知道了',
  },
]

const storage = new Storage()

export const useMessageStore = create<MessageStore>((set, get) => ({
  messages: [],
  init: () => set({ messages: storage.get<Message[]>('messages') || DEFAULT_MESSAGE }),
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
  reset: () => {
    set(() => ({ messages: DEFAULT_MESSAGE }))
  },
  save: () => {
    storage.set<Message[]>('messages', get().messages)
  },
  revoke: () => {
    set((state) => ({ messages: state.messages.slice(-2) }))
  },
}))
