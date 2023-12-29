import { useEffect, useState } from 'react'
import MarkdownIt from 'markdown-it'
import markdownHighlight from 'markdown-it-highlightjs'
import markdownKatex from '@traptitech/markdown-it-katex'
import Clipboard from 'clipboard'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

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

const registerCopy = (className: string) => {
  const clipboard = new Clipboard(className, {
    text: function (trigger) {
      return decodeURIComponent(trigger.getAttribute('data-clipboard-text') || '')
    },
  })
  // 复制成功失败的提示
  clipboard.on('success', () => {
    console.info('复制成功')
  })
  clipboard.on('error', () => {
    console.error('复制失败')
  })
  return clipboard
}

export default function MessageItem({ role, content }: Message) {
  const [html, setHtml] = useState<string>('')

  const render = (content: string) => {
    const md: MarkdownIt = MarkdownIt({
      linkify: true,
      breaks: true,
    })
      .use(markdownHighlight)
      .use(markdownKatex)

    const mathLineRender = md.renderer.rules.math_inline!
    md.renderer.rules.math_inline = (...params) => {
      const [tokens, idx] = params
      const token = tokens[idx]
      return `
        <div class="katex-inline-warpper">
          <span class="copy copy-katex-inline" data-clipboard-text="${encodeURIComponent(token.content)}">复制</span>
          ${mathLineRender(...params)}
        </div>`
    }
    const mathBlockRender = md.renderer.rules.math_block!
    md.renderer.rules.math_block = (...params) => {
      const [tokens, idx] = params
      const token = tokens[idx]
      return `
        <div class="katex-block-warpper">
          <span class="copy copy-katex-block" data-clipboard-text="${encodeURIComponent(token.content)}">复制</span>
          ${mathBlockRender(...params)}
        </div>`
    }
    const highlightRender = md.renderer.rules.fence!
    md.renderer.rules.fence = (...params) => {
      const [tokens, idx] = params
      const token = tokens[idx]
      return `
        <div class="hljs-warpper">
          <div class="info">
            <span class="lang">${token.info.trim()}</span>
            <span class="copy copy-code" data-clipboard-text="${encodeURIComponent(token.content)}">复制</span>
          </div>
          ${highlightRender(...params)}
        </div>`
    }
    return md.render(content)
  }

  useEffect(() => {
    setHtml(render(content))
    const copyKatexInline = registerCopy('.copy-katex-inline')
    const copyKatexBlock = registerCopy('.copy-katex-block')
    const copyCode = registerCopy('.copy-code')
    return () => {
      setHtml('')
      copyKatexInline.destroy()
      copyKatexBlock.destroy()
      copyCode.destroy()
    }
  }, [content])

  return (
    <>
      <Avatar className="h-8 w-8">
        <AvatarFallback>{role === 'user' ? 'User' : 'AI'}</AvatarFallback>
      </Avatar>
      <div
        className="prose overflow-hidden break-words text-base leading-8"
        dangerouslySetInnerHTML={{ __html: html }}
      ></div>
    </>
  )
}
