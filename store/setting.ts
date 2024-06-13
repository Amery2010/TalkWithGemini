import { create } from 'zustand'
import storage from '@/utils/Storage'
import { dataMigration } from '@/utils/migration'
import { detectLanguage } from '@/utils/common'
import { OldTextModel, OldVisionModel, type Model } from '@/constant/model'

interface SettingStore extends Setting {
  init: (isProtected: boolean) => Promise<Setting>
  setPassword: (password: string) => void
  setApiKey: (key: string) => void
  setApiProxy: (url: string) => void
  setUploadProxy: (url: string) => void
  setModel: (model: string) => void
  setLang: (lang: string) => void
  setSTTLang: (lang: string) => void
  setTTSLang: (lang: string) => void
  setTTSVoice: (voice: string) => void
  setTalkMode: (mode: 'chat' | 'voice') => void
  setMaxHistoryLength: (length: number) => void
  setAssistantIndexUrl: (url: string) => void
  setTopP: (value: number) => void
  setTopK: (value: number) => void
  setTemperature: (value: number) => void
  setMaxOutputTokens: (value: number) => void
  setSafety: (level: string) => void
  setAutoStopRecord: (active: boolean) => void
}

const ASSISTANT_INDEX_URL = process.env.NEXT_PUBLIC_ASSISTANT_INDEX_URL

function getDefaultModelConfig(model: string) {
  if (OldTextModel.includes(model as Model)) {
    return { topP: 1, topK: 16, temperature: 0.9, maxOutputTokens: 2048 }
  } else if (OldVisionModel.includes(model as Model)) {
    return { topP: 1, topK: 32, temperature: 0.4, maxOutputTokens: 4096 }
  } else {
    return { topP: 0.95, topK: 64, temperature: 1, maxOutputTokens: 8192 }
  }
}

export const useSettingStore = create<SettingStore>((set) => ({
  password: '',
  apiKey: '',
  apiProxy: '',
  uploadProxy: '',
  model: '',
  sttLang: '',
  ttsLang: '',
  ttsVoice: '',
  lang: '',
  isProtected: false,
  talkMode: 'chat',
  maxHistoryLength: 0,
  assistantIndexUrl: '',
  topP: 0.95,
  topK: 64,
  temperature: 1,
  maxOutputTokens: 8192,
  safety: 'none',
  autoStopRecord: false,
  init: async (isProtected) => {
    await dataMigration()
    const sttLang = await storage.getItem<string>('sttLang')
    const ttsLang = await storage.getItem<string>('ttsLang')
    const ttsVoice = await storage.getItem<string>('ttsVoice')
    const lang = (await storage.getItem<string>('lang')) || detectLanguage()
    const model = (await storage.getItem<string>('model')) || 'gemini-1.5-flash-latest'
    const defaultModelConfig = getDefaultModelConfig(model)
    const state: Setting = {
      password: (await storage.getItem<string>('password')) || '',
      apiKey: (await storage.getItem<string>('apiKey')) || '',
      apiProxy: (await storage.getItem<string>('apiProxy')) || 'https://generativelanguage.googleapis.com',
      uploadProxy: (await storage.getItem<string>('uploadProxy')) || 'https://generativelanguage.googleapis.com',
      model,
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
      topP: (await storage.getItem<number>('topP')) ?? defaultModelConfig.topP,
      topK: (await storage.getItem<number>('topK')) ?? defaultModelConfig.topK,
      temperature: (await storage.getItem<number>('temperature')) ?? defaultModelConfig.temperature,
      maxOutputTokens: (await storage.getItem<number>('maxOutputTokens')) ?? defaultModelConfig.maxOutputTokens,
      safety: (await storage.getItem<string>('safety')) || 'none',
      autoStopRecord: (await storage.getItem<boolean>('autoStopRecord')) || false,
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
  setUploadProxy: (url) => {
    set(() => ({ uploadProxy: url }))
    storage.setItem<string>('uploadProxy', url)
  },
  setModel: async (model) => {
    const defaultModelConfig = getDefaultModelConfig(model)
    const topP = (await storage.getItem<number>('topP')) ?? defaultModelConfig.topP
    const topK = (await storage.getItem<number>('topK')) ?? defaultModelConfig.topK
    const temperature = (await storage.getItem<number>('temperature')) ?? defaultModelConfig.temperature
    const maxOutputTokens = (await storage.getItem<number>('maxOutputTokens')) ?? defaultModelConfig.maxOutputTokens
    set(() => ({ model, topP, topK, temperature, maxOutputTokens }))
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
  setTopP: (value) => {
    set(() => ({ topP: value }))
    storage.setItem<number>('topP', value)
  },
  setTopK: (value) => {
    set(() => ({ topK: value }))
    storage.setItem<number>('topK', value)
  },
  setTemperature: (value) => {
    set(() => ({ temperature: value }))
    storage.setItem<number>('temperature', value)
  },
  setMaxOutputTokens: (value) => {
    set(() => ({ maxOutputTokens: value }))
    storage.setItem<number>('maxOutputTokens', value)
  },
  setSafety: (level) => {
    set(() => ({ safety: level }))
    storage.setItem<string>('safety', level)
  },
  setAutoStopRecord: (active) => {
    set(() => ({ autoStopRecord: active }))
    storage.setItem<boolean>('autoStopRecord', active)
  },
}))
