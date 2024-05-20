import { create } from 'zustand'
import storage from '@/utils/Storage'
import { dataMigration } from '@/utils/migration'
import { detectLanguage } from '@/utils/common'

interface SettingStore extends Setting {
  init: (isProtected: boolean) => Promise<Setting>
  setPassword: (password: string) => void
  setApiKey: (key: string) => void
  setApiProxy: (url: string) => void
  setModel: (model: string) => void
  setLang: (lang: string) => void
  setSTTLang: (lang: string) => void
  setTTSLang: (lang: string) => void
  setTTSVoice: (voice: string) => void
  setTalkMode: (mode: 'chat' | 'voice') => void
  setMaxHistoryLength: (length: number) => void
  setAssistantIndexUrl: (url: string) => void
}

const ASSISTANT_INDEX_URL = process.env.ASSISTANT_INDEX_URL

export const useSettingStore = create<SettingStore>((set) => ({
  password: '',
  apiKey: '',
  apiProxy: '',
  model: '',
  sttLang: '',
  ttsLang: '',
  ttsVoice: '',
  lang: '',
  isProtected: false,
  talkMode: 'chat',
  maxHistoryLength: 0,
  assistantIndexUrl: '',
  init: async (isProtected) => {
    await dataMigration()
    const sttLang = await storage.getItem<string>('sttLang')
    const ttsLang = await storage.getItem<string>('ttsLang')
    const ttsVoice = await storage.getItem<string>('ttsVoice')
    const lang = (await storage.getItem<string>('lang')) || detectLanguage()
    const state: Setting = {
      password: (await storage.getItem<string>('password')) || '',
      apiKey: (await storage.getItem<string>('apiKey')) || '',
      apiProxy: (await storage.getItem<string>('apiProxy')) || 'https://generativelanguage.googleapis.com',
      model: (await storage.getItem<string>('model')) || 'gemini-1.5-flash-latest',
      sttLang: sttLang || lang,
      ttsLang: ttsLang || lang,
      ttsVoice: ttsVoice || '',
      lang,
      isProtected: !!isProtected,
      talkMode: ((await storage.getItem<string>('talkMode')) as Setting['talkMode']) || 'chat',
      maxHistoryLength: Number((await storage.getItem<string>('maxHistoryLength')) || '0'),
      assistantIndexUrl:
        (await storage.getItem<string>('assistantIndexUrl')) ||
        ASSISTANT_INDEX_URL ||
        'https://chat-agents.lobehub.com',
    }
    set(() => state)
    return state
  },
  setPassword: (password) => {
    set(() => ({ password }))
    storage.setItem<string>('password', password)
  },
  setApiKey: (key) => {
    set(() => ({ apiKey: key }))
    storage.setItem<string>('apiKey', key)
  },
  setApiProxy: (url) => {
    set(() => ({ apiProxy: url }))
    storage.setItem<string>('apiProxy', url)
  },
  setModel: (model) => {
    set(() => ({ model }))
    storage.setItem<string>('model', model)
  },
  setLang: (lang) => {
    set(() => ({ lang }))
    storage.setItem<string>('lang', lang)
  },
  setSTTLang: (lang) => {
    set(() => ({ sttLang: lang }))
    storage.setItem<string>('sttLang', lang)
  },
  setTTSLang: (lang) => {
    set(() => ({ ttsLang: lang }))
    storage.setItem<string>('ttsLang', lang)
  },
  setTTSVoice: (voice) => {
    set(() => ({ ttsVoice: voice }))
    storage.setItem<string>('ttsVoice', voice)
  },
  setTalkMode: (mode) => {
    set(() => ({ talkMode: mode }))
    storage.setItem<string>('talkMode', mode)
  },
  setMaxHistoryLength: (length) => {
    set(() => ({ maxHistoryLength: length }))
    storage.setItem<string>('maxHistoryLength', length.toString())
  },
  setAssistantIndexUrl: (url) => {
    set(() => ({ assistantIndexUrl: url }))
    storage.setItem<string>('assistantIndexUrl', url)
  },
}))
