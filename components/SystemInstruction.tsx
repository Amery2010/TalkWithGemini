import { useState, useEffect, useCallback, memo } from 'react'
import { useTranslation } from 'react-i18next'
import MarkdownIt from 'markdown-it'
import markdownHighlight from 'markdown-it-highlightjs'
import highlight from 'highlight.js'
import markdownKatex from '@traptitech/markdown-it-katex'
import { X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { upperFirst } from 'lodash-es'

type Props = {
  prompt: string
  onClear: () => void
}

function SystemInstruction({ prompt, onClear }: Props) {
  const { t } = useTranslation()
  const [html, setHtml] = useState<string>('')

  const render = useCallback((content: string) => {
    const md: MarkdownIt = MarkdownIt({
      linkify: true,
      breaks: true,
    })
      .use(markdownHighlight)
      .use(markdownKatex)

    const mathLineRender = md.renderer.rules.math_inline!
    md.renderer.rules.math_inline = (...params) => {
      return `
          <div class="katex-inline-warpper">
            ${mathLineRender(...params)}
          </div>
        `
    }
    const mathBlockRender = md.renderer.rules.math_block!
    md.renderer.rules.math_block = (...params) => {
      return `
          <div class="katex-block-warpper">
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
            </div>
            ${highlight.getLanguage(lang) ? highlightRender(...params) : null}
          </div>
        `
    }
    return md.render(content)
  }, [])

  useEffect(() => {
    setHtml(render(prompt))
    return () => {
      setHtml('')
    }
  }, [prompt, render])

  return (
    <Card className="w-full">
      <CardHeader className="relative px-4 pb-2 pt-4">
        <CardTitle className="text-lg font-medium">{t('assistantSetting')}</CardTitle>
        <X
          className="absolute right-4 top-3 h-6 w-6 cursor-pointer rounded-full p-1 text-muted-foreground hover:bg-secondary/80"
          onClick={() => onClear()}
        />
      </CardHeader>
      <ScrollArea className="max-h-[130px] overflow-y-auto max-sm:max-h-[90px]">
        <CardContent className="p-4 pt-0">
          <div
            className="prose w-full overflow-hidden break-words text-sm leading-6"
            dangerouslySetInnerHTML={{ __html: html }}
          ></div>
        </CardContent>
      </ScrollArea>
    </Card>
  )
}

export default memo(SystemInstruction)
