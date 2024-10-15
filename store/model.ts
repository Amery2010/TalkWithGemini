import { create } from 'zustand'
import storage from '@/utils/Storage'

type ModelStore = {
  models: Model[]
  cachedTime: number
  init: () => Promise<Model[]>
  update: (models: Model[]) => void
  setCachedTime: (timestamp: number) => void
}

export const useModelStore = create<ModelStore>((set) => ({
  models: [],
  cachedTime: 0,
  init: async () => {
    const models = (await storage.getItem<Model[]>('models')) || []
    const cachedTime = (await storage.getItem<number>('modelsCachedTime')) || 0
    set(() => ({ models, cachedTime }))
    return models
  },
  update: (models) => {
    set(() => ({ models: [...models] }))
    storage.setItem<Model[]>('models', models)
  },
  setCachedTime: (timestamp) => {
    set(() => ({ cachedTime: timestamp }))
    storage.setItem<number>('modelsCachedTime', timestamp)
  },
}))
