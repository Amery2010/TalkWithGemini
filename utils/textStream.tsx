/**
 * 文本流截断处理
 * @param readable 可读流
 * @param onMessage 消息回调函数
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

  while (true) {
    let { value, done } = await reader.read()
    if (done) {
      buffer && onStatement(buffer)
      break
    }
    // stream: true is important here, fix the bug of incomplete line
    const chunk = decoder.decode(value, { stream: true })
    onMessage(chunk)
    const lines = (buffer + chunk).split(reg)
    buffer = lines.pop() || ''

    for (const line of lines) {
      onStatement(line)
    }
  }
}
