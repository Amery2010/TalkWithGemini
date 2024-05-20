import { memo, useEffect, useState, useCallback, useMemo } from 'react'
import MarkdownIt from 'markdown-it'
import markdownHighlight from 'markdown-it-highlightjs'
import highlight from 'highlight.js'
import markdownKatex from '@traptitech/markdown-it-katex'
import Clipboard from 'clipboard'
import { useTranslation } from 'react-i18next'
import { User, Bot } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import BubblesLoading from '@/components/BubblesLoading'
import FileList from '@/components/FileList'
import { upperFirst, find } from 'lodash-es'

const registerCopy = (className: string) => {
  const clipboard = new Clipboard(className, {
    text: function (trigger) {
      return decodeURIComponent(trigger.getAttribute('data-clipboard-text') || '')
    },
  })
  return clipboard
}

function MessageItem({ role, parts, attachments }: Message) {
  const { t } = useTranslation()
  const [html, setHtml] = useState<string>('')
  const fileList = useMemo(() => {
    return attachments ? attachments.filter((item) => !item.metadata?.mimeType.startsWith('image/')) : []
  }, [attachments])

  const render = useCallback(
    (content: string) => {
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
            <span class="copy copy-katex-inline" data-clipboard-text="${encodeURIComponent(token.content)}">${t(
              'copy',
            )}</span>
            ${mathLineRender(...params)}
          </div>
        `
      }
      const mathBlockRender = md.renderer.rules.math_block!
      md.renderer.rules.math_block = (...params) => {
        const [tokens, idx] = params
        const token = tokens[idx]
        return `
          <div class="katex-block-warpper">
            <span class="copy copy-katex-block" data-clipboard-text="${encodeURIComponent(token.content)}">${t(
              'copy',
            )}</span>
            ${mathBlockRender(...params)}
          </div>
        `
      }
      const highlightRender = md.renderer.rules.fence!
      md.renderer.rules.fence = (...params) => {
        const [tokens, idx] = params
        const token = tokens[idx]
        const lang = token.info.trim()
        return `
          <div class="hljs-warpper">
            <div class="info">
              <span class="lang">${upperFirst(lang)}</span>
              <span class="copy copy-code" data-clipboard-text="${encodeURIComponent(token.content)}">${t(
                'copy',
              )}</span>
            </div>
            ${highlight.getLanguage(lang) ? highlightRender(...params) : null}
          </div>
        `
      }
      return md.render(content)
    },
    [t],
  )

  useEffect(() => {
    const messageParts: string[] = []
    parts.forEach(async (part) => {
      if (part.text) {
        messageParts.push(render(part.text))
      } else if (part.inlineData?.mimeType.startsWith('image/')) {
        messageParts.push(
          `<img class="inline-image" alt="inline-image" src="data:${part.inlineData.mimeType};base64,${part.inlineData.data}" />`,
        )
      } else if (part.fileData && attachments) {
        for (const attachment of attachments) {
          if (attachment.metadata?.uri === part.fileData.fileUri) {
            if (part.fileData?.mimeType.startsWith('image/')) {
              messageParts.push(`<img class="inline-image" alt="inline-image" src="${attachment.preview}" />`)
            }
          }
        }
      }
    })
    setHtml(messageParts.join(''))
    const copyKatexInline = registerCopy('.copy-katex-inline')
    const copyKatexBlock = registerCopy('.copy-katex-block')
    const copyCode = registerCopy('.copy-code')
    return () => {
      setHtml('')
      copyKatexInline.destroy()
      copyKatexBlock.destroy()
      copyCode.destroy()
    }
  }, [parts, attachments, render])

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
      {role === 'model' && parts[0].text === '' ? (
        <BubblesLoading />
      ) : (
        <div className="flex-auto">
          {fileList.length > 0 ? (
            <div className="w-full border-b border-dashed pb-2">
              <FileList fileList={fileList} />
            </div>
          ) : null}
          <div
            className="prose w-full overflow-hidden break-words text-base leading-8"
            dangerouslySetInnerHTML={{ __html: html }}
          ></div>
        </div>
      )}
    </>
  )
}

export default memo(MessageItem)
