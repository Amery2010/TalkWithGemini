import { create } from 'zustand'
import { shuffleArray } from '@/utils/common'

type AssistantStore = {
  assistants: Assistant[]
  recommendation: Assistant[]
  update: (assistants: Assistant[]) => void
  recommend: (amount: number) => void
}

export const useAssistantStore = create<AssistantStore>((set, get) => ({
  assistants: [],
  recommendation: [],
  update: (assistants) => {
    set(() => ({
      assistants: [...assistants],
    }))
  },
  recommend: (amount = 1) => {
    set(() => ({
      recommendation: shuffleArray<Assistant>(get().assistants).slice(0, amount),
    }))
  },
}))
