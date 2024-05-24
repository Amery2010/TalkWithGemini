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

export function formatTime(seconds: number): string {
  if (seconds < 0) return `--:--`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)

  const minutesStr = minutes.toString().padStart(2, '0')
  const secondsStr = remainingSeconds.toString().padStart(2, '0')

  return `${minutesStr}:${secondsStr}`
}

export async function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.addEventListener('load', () => resolve(reader.result as string))
    reader.addEventListener('error', reject)
  })
}

export function formatSize(size: number, pointLength = 2, units?: string[]): string {
  if (typeof size === 'undefined') return '0'
  if (typeof units === 'undefined') units = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  let unit
  while ((unit = units.shift() as string) && size >= 1024) size = size / 1024
  return (unit === units[0] ? size : size.toFixed(pointLength === undefined ? 2 : pointLength)) + unit
}

export const sentenceSegmentation = (content: string, locale: string) => {
  const segmenter = new Intl.Segmenter(locale, { granularity: 'sentence' })
  const segments = segmenter.segment(content)
  return Array.from(segments).map((item) => item.segment)
}
