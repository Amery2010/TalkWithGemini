import { create } from 'zustand'
import { shuffleArray } from '@/utils/common'

type AssistantStore = {
  assistants: Assistant[]
  tags: string[]
  recommendation: Assistant[]
  update: (assistants: Assistant[]) => void
  updateTags: (tags: string[]) => void
  recommend: (amount: number) => void
}

export const useAssistantStore = create<AssistantStore>((set, get) => ({
  assistants: [],
  tags: [],
  recommendation: [],
  update: (assistants) => {
    set(() => ({
      assistants: [...assistants],
    }))
  },
  updateTags: (tags) => {
    set(() => ({
      tags: [...tags],
    }))
  },
  recommend: (amount = 1) => {
    set(() => ({
      recommendation: shuffleArray<Assistant>(get().assistants).slice(0, amount),
    }))
  },
}))
