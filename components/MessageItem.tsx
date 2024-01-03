'use client'
import { memo, useEffect, useState } from 'react'
import MarkdownIt from 'markdown-it'
import markdownHighlight from 'markdown-it-highlightjs'
import markdownKatex from '@traptitech/markdown-it-katex'
import Clipboard from 'clipboard'
import { User, Bot } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const registerCopy = (className: string) => {
  const clipboard = new Clipboard(className, {
    text: function (trigger) {
      return decodeURIComponent(trigger.getAttribute('data-clipboard-text') || '')
    },
  })
  return clipboard
}

function MessageItem({ role, content }: Message) {
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
        {role === 'user' ? (
          <AvatarFallback className="bg-green-300 text-white">
            <User />
          </AvatarFallback>
        ) : (
          <AvatarFallback className="bg-red-300 text-white">
            <Bot />
          </AvatarFallback>
        )}
      </Avatar>
      <div
        className="prose overflow-hidden break-words text-base leading-8"
        dangerouslySetInnerHTML={{ __html: html }}
      ></div>
    </>
  )
}

export default memo(MessageItem)
