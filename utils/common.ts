import LanguageDetector from 'i18next-browser-languagedetector'
import locales from '@/constant/locales'

export function detectLanguage() {
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
