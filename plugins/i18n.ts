import i18n from 'i18next'
import resourcesToBackend from 'i18next-resources-to-backend'
import { initReactI18next } from 'react-i18next'

const normalizeLocale = (locale: string) => {
  switch (locale) {
    case 'zh-CN':
    case 'zh': {
      return 'zh'
    }
    case 'en-US':
    case 'en': {
      return 'en'
    }
    default: {
      return locale
    }
  }
}

i18n
  .use(initReactI18next)
  .use(
    resourcesToBackend(async (lng: string) => {
      return await import(`@/locales/${normalizeLocale(lng)}.json`)
    }),
  )
  .init({
    fallbackLng: 'en',
  })

export default i18n
