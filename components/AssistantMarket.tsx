import { useState, useCallback, useEffect, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardDescription, CardHeader, CardFooter, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import SearchBar from '@/components/SearchBar'
import { useSettingStore } from '@/store/setting'
import AssistantMarketUrl from '@/utils/AssistantMarketUrl'

type AssistantProps = {
  open: boolean
  onClose: () => void
  onSelect: (prompt: string) => void
  onLoaded: (assistantList: Assistant[]) => void
}

function search(keyword: string, data: Assistant[]): Assistant[] {
  const results: Assistant[] = []
  // 'i' means case-insensitive
  const regex = new RegExp(keyword.trim(), 'gi')
  data.forEach((item) => {
    if (item.meta.tags.includes(keyword) || regex.test(item.meta.title) || regex.test(item.meta.description)) {
      results.push(item)
    }
  })
  return results
}

function Assistant({ open, onClose, onSelect, onLoaded }: AssistantProps) {
  const { t } = useTranslation()
  const { lang, assistantIndexUrl } = useSettingStore()
  const [reources, setResources] = useState<Assistant[]>([])
  const [assistantList, setAssistantList] = useState<Assistant[]>([])

  const handleClose = useCallback(
    (open: boolean) => {
      if (!open) onClose()
    },
    [onClose],
  )

  const handleSelect = useCallback(
    async (assistant: Assistant) => {
      onClose()
      const assistantMarketUrl = new AssistantMarketUrl(assistantIndexUrl)
      const response = await fetch(assistantMarketUrl.getAssistantUrl(assistant.identifier, lang))
      const assistantDeatil: AssistantDetail = await response.json()
      onSelect(assistantDeatil.config.systemRole)
    },
    [lang, assistantIndexUrl, onClose, onSelect],
  )

  const handleSearch = useCallback(
    (keyword: string) => {
      const result = search(keyword, reources)
      setAssistantList(result)
    },
    [reources],
  )

  const fetchAssistantMarketIndex = useCallback(async () => {
    const assistantMarketUrl = new AssistantMarketUrl(assistantIndexUrl)
    const response = await fetch(assistantMarketUrl.getIndexUrl(lang))
    const assistantMarketIndex = await response.json()
    const assistants = assistantMarketIndex.agents
    setResources(assistants)
    setAssistantList(assistants)
    onLoaded(assistants)
  }, [lang, assistantIndexUrl, onLoaded])

  useEffect(() => {
    if (assistantIndexUrl !== '') {
      fetchAssistantMarketIndex()
    }
  }, [assistantIndexUrl, fetchAssistantMarketIndex])

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-screen-md p-0 max-sm:h-full landscape:max-md:h-full">
        <DialogHeader className="p-6 pb-0 max-sm:p-4 max-sm:pb-0">
          <DialogTitle>{t('topicSquare')}</DialogTitle>
          <DialogDescription className="pb-2">{t('selectTopic')}</DialogDescription>
          <SearchBar onSearch={handleSearch} onClear={() => setAssistantList(reources)} />
        </DialogHeader>
        <ScrollArea className="h-[400px] w-full scroll-smooth max-sm:h-full">
          <div className="grid grid-cols-2 gap-2 p-6 pt-0 max-sm:grid-cols-1 max-sm:p-4 max-sm:pt-0">
            {assistantList.map((assistant) => {
              return (
                <Card
                  key={assistant.identifier}
                  className="cursor-pointer transition-colors hover:drop-shadow-md dark:hover:border-white/80"
                  onClick={() => handleSelect(assistant)}
                >
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="truncate text-lg">{assistant.meta.title}</CardTitle>
                    <CardDescription className="text-line-clamp-2 h-10">{assistant.meta.description}</CardDescription>
                  </CardHeader>
                  <CardFooter className="flex justify-between p-4 pt-0">
                    <span>{assistant.createAt}</span>
                    <a
                      className="underline-offset-4 hover:underline"
                      href={assistant.homepage}
                      target="_blank"
                      onClick={(ev) => ev.stopPropagation()}
                    >
                      @{assistant.author}
                    </a>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

export default memo(Assistant)
