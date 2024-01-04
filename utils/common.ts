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

export function shuffleArray<T>(array: T[]): T[] {
  const newArray = array.slice() // Create a copy of the original array

  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)) // Randomly generate an integer between 0 and i
    // Swap the values of newArray[i] and newArray[j]
    ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }

  return newArray
}
