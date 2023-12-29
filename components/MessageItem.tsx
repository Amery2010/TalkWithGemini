import MarkdownIt from 'markdown-it'
import markdownHighlight from 'markdown-it-highlightjs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useEffect, useState } from 'react'

type Props = {
  role: string
  content: string
}

export function filterMarkdown(text: string): string {
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

export default function MessageItem({ role, content }: Props) {
  const [html, setHtml] = useState<string>('')

  const render = (content: string) => {
    const md: MarkdownIt = MarkdownIt({
      linkify: true,
      breaks: true,
    }).use(markdownHighlight)
    return md.render(content)
  }

  useEffect(() => {
    setHtml(render(content))
    return () => {
      setHtml('')
    }
  }, [content])

  return (
    <>
      <Avatar className="h-8 w-8">
        <AvatarFallback>{role === 'user' ? 'User' : 'AI'}</AvatarFallback>
      </Avatar>
      <code
        className="prose overflow-hidden break-words text-base leading-8"
        dangerouslySetInnerHTML={{ __html: html }}
      ></code>
    </>
  )
}
