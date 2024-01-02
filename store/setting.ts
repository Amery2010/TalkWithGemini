import { create } from 'zustand'
import { EdgeSpeechTTS } from '@lobehub/tts'
import LanguageDetector from 'i18next-browser-languagedetector'
import Storage from '@/utils/Storage'
import locales from '@/constant/locales'

interface SettingStore extends Setting {
  init: () => void
  setPassword: (password: string) => void
  setApiKey: (key: string) => void
  setApiProxy: (url: string) => void
  setSTTLang: (lang: string) => void
  setTTSLang: (lang: string) => void
  setTTSVoice: (voice: string) => void
}

const storage = new Storage()

function detectLanguage() {
  const languageDetector = new LanguageDetector()
  languageDetector.init()
  const detectedLang = languageDetector.detect()
  let lang: string = 'en-US'
  const localeLang = Object.keys(locales)
  if (Array.isArray(detectedLang)) {
    detectedLang.reverse().forEach((langCode) => {
      if (localeLang.includes(langCode)) {
        lang = langCode
      }
    })
  } else if (typeof detectedLang === 'string') {
    if (localeLang.includes(detectedLang)) {
      lang = detectedLang
    }
  }
  return lang
}

export const useSettingStore = create<SettingStore>((set) => ({
  password: '',
  apiKey: '',
  apiProxy: '',
  sttLang: '',
  ttsLang: '',
  ttsVoice: '',
  init: () => {
    const sttLang = storage.get<string>('sttLang')
    const ttsLang = storage.get<string>('ttsLang')
    const ttsVoice = storage.get<string>('ttsVoice')
    const state: Partial<Setting> = {
      password: storage.get<string>('password') || '',
      apiKey: storage.get<string>('apiKey') || '',
      apiProxy: storage.get<string>('apiProxy') || 'https://generativelanguage.googleapis.com',
    }
    const lang = detectLanguage()
    state.sttLang = sttLang || lang
    state.ttsLang = ttsLang || lang
    if (ttsVoice) {
      state.ttsVoice = ttsVoice
    } else {
      const voiceOptions = new EdgeSpeechTTS({ locale: state.ttsLang }).voiceOptions
      state.ttsVoice = voiceOptions ? (voiceOptions[0].value as string) : 'en-US-JennyNeural'
    }
    set(() => state)
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
  setSTTLang: (lang) => {
    set(() => ({ sttLang: lang }))
    storage.set<string>('sttLang', lang)
  },
  setTTSLang: (lang) => {
    set(() => ({ ttsLang: lang }))
    storage.set<string>('ttsLang', lang)
  },
  setTTSVoice: (voice) => {
    set(() => ({ ttsVoice: voice }))
    storage.set<string>('ttsVoice', voice)
  },
}))
