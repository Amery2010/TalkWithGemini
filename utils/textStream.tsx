/**
 * Text stream truncation processing
 * @param readable readable stream
 * @param onMessage message callback function
 * @param onStatement statement callback function, used in talk mode
 */
export default async function textStream(
  readable: ReadableStream,
  onMessage: (text: string) => void,
  onStatement: (statement: string) => void,
) {
  const reader = readable.getReader()

  const decoder = new TextDecoder('utf-8')
  const reg = /(?:\n\n|\r\r|\r\n\r\n)/
  let buffer = ''
  let remainText = ''
  const chunks: string[] = []

  const handleChunk = (chunk: string) => {
    const lines = (buffer + chunk).split(reg)
    buffer = lines.pop() || ''

    for (const line of lines) {
      onStatement(line)
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
        const fetchCount = Math.max(1, Math.round(remainText.length / 60))
        const fetchText = remainText.slice(0, fetchCount)
        remainText = remainText.slice(fetchCount)
        onMessage(fetchText)
        requestAnimationFrame(animateResponseText)
      } else {
        if (chunks.length > 0) {
          handleRemainingText()
        }
      }
    }
    animateResponseText()
  }

  while (true) {
    let { value, done } = await reader.read()
    if (done) {
      buffer && onStatement(buffer)
      chunks.length > 0 && handleRemainingText()
      break
    }
    // stream: true is important here, fix the bug of incomplete line
    const chunk = decoder.decode(value, { stream: true })
    chunks.push(chunk)
    handleRemainingText()
    handleChunk(chunk)
  }
}
