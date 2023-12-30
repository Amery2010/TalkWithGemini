import MarkdownIt from 'markdown-it'

export default function filterMarkdown(text: string): string {
  const md = new MarkdownIt()
  // 使用 markdown-it 将 Markdown 转换为 HTML
  const html = md.render(text)
  // 使用 DOMParser 将 HTML 转换为 DOM 对象
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  // 获取过滤后的文本内容
  const filteredText = doc.body.textContent || ''
  return filteredText
}
