import { create } from 'zustand'
import Storage from '@/utils/Storage'

interface SettingStore extends Setting {
  init: () => Setting
  setPassword: (password: string) => void
  setApiKey: (key: string) => void
  setApiProxy: (url: string) => void
  setLang: (lang: string) => void
}

const storage = new Storage()

export const useSettingStore = create<SettingStore>((set) => ({
  password: '',
  apiKey: '',
  apiProxy: '',
  lang: '',
  init: () => {
    const state: Setting = {
      password: storage.get<string>('password') || '',
      apiKey: storage.get<string>('apiKey') || '',
      apiProxy: storage.get<string>('apiProxy') || 'https://generativelanguage.googleapis.com',
      lang: storage.get<string>('lang') || '',
    }
    set(() => state)
    return state
  },
  setPassword: (password) => {
    set(() => ({ password }))
    storage.set<string>('password', password)
  },
  setApiKey: (key) => {
    set(() => ({ apiKey: key }))
    storage.set<string>('apiKey', key)
  },
  setApiProxy: (url) => {
    set(() => ({ apiProxy: url }))
    storage.set<string>('apiProxy', url)
  },
  setLang: (lang) => {
    set(() => ({ lang }))
    storage.set<string>('lang', lang)
  },
}))
