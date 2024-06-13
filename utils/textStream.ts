/**
 * Text stream truncation processing
 * @param options.readable readable stream
 * @param options.locale locale lang
 * @param options.onMessage message callback function
 * @param options.onStatement statement callback function, used in talk mode
 * @param options.onFinish finish callback function
 * @param options.sentenceLength sentence length, default is 80
 */
export default async function textStream(options: {
  readable: ReadableStream
  locale: string
  onMessage: (text: string) => void
  onStatement: (statement: string) => void
  onFinish: () => void
  sentenceLength?: number
}) {
  const { readable, locale, onMessage, onStatement, onFinish, sentenceLength = 100 } = options
  const reader = readable.getReader()

  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  let remainText = ''
  const chunks: string[] = []

  const handleChunk = (chunk: string) => {
    const text = buffer + chunk
    if (text.length >= sentenceLength) {
      const segmenter = new Intl.Segmenter(locale, { granularity: 'sentence' })
      const segments = segmenter.segment(text)
      const lines = Array.from(segments).map((item) => item.segment)

      buffer = lines.pop() || ''

      onStatement(lines.join(''))
    } else {
      buffer = text
    }
  }
  const handleRemainingText = () => {
    if (remainText.length > 0) {
      return false
    } else {
      remainText = chunks.shift() ?? ''
    }
    // animate response to make it looks smooth
    const animateResponseText = () => {
      if (remainText.length > 0) {
        const fetchCount = Math.max(1, Math.round(remainText.length / 90))
        const fetchText = remainText.slice(0, fetchCount)
        remainText = remainText.slice(fetchCount)
        onMessage(fetchText)
        requestAnimationFrame(animateResponseText)
      } else {
        if (chunks.length > 0) {
          handleRemainingText()
        } else {
          onFinish()
        }
      }
    }
    animateResponseText()
  }

  while (true) {
    let { value, done } = await reader.read()
    if (done) {
      if (buffer) onStatement(buffer)
      if (chunks.length > 0) {
        handleRemainingText()
      } else {
        onFinish()
      }
      break
    }
    // stream: true is important here, fix the bug of incomplete line
    const chunk = decoder.decode(value, { stream: true })
    chunks.push(chunk)
    handleRemainingText()
    handleChunk(chunk)
  }
}

export async function streamToText(readableStream: ReadableStream): Promise<string> {
  const reader = readableStream.getReader()
  let text = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    text += new TextDecoder().decode(value)
  }
  return text
}
