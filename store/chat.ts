import { create } from 'zustand'

type MessageStore = {
  messages: Message[]
  addMessage: (message: Message) => void
  updateMessage: (content: string) => void
}

export const useMessageStore = create<MessageStore>((set) => ({
  messages: [
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
  ],
  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, message],
    }))
  },
  updateMessage: (content) => {
    set((state) => {
      state.messages[state.messages.length - 1].content += content
      return {
        messages: state.messages,
      }
    })
  },
}))
