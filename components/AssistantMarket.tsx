import { useState, useCallback, useLayoutEffect, memo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardDescription, CardHeader, CardFooter, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import SearchBar from '@/components/SearchBar'
import { useAssistantStore } from '@/store/assistant'
import { useSettingStore } from '@/store/setting'
import AssistantMarketUrl from '@/utils/AssistantMarketUrl'

type AssistantProps = {
  open: boolean
  onClose: () => void
  onSelect: (prompt: string) => void
  onLoaded: () => void
}

type AssistantMarketIndex = {
  agents: Assistant[]
  tags: string[]
  schemaVersion: number
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

function filterDataByTag(data: Assistant[], tag: string): Assistant[] {
  return tag !== 'all' ? data.filter((item) => item.meta.tags.includes(tag)) : data
}

function Assistant({ open, onClose, onSelect, onLoaded }: AssistantProps) {
  const { t } = useTranslation()
  const { assistants, tags, update: updateAssistants, updateTags } = useAssistantStore()
  const { lang, assistantIndexUrl } = useSettingStore()
  const [assistantList, setAssistantList] = useState<Assistant[]>([])
  const [tagList, setTagList] = useState<string[]>([])
  const [currentTag, setCurrentTag] = useState<string>('all')

  const handleClose = useCallback(
    (open: boolean) => {
      if (!open) {
        onClose()
        setCurrentTag('')
        setAssistantList(assistants)
      }
    },
    [assistants, onClose],
  )

  const handleSelect = useCallback(
    async (assistant: Assistant) => {
      handleClose(false)
      const assistantMarketUrl = new AssistantMarketUrl(assistantIndexUrl)
      const response = await fetch(assistantMarketUrl.getAssistantUrl(assistant.identifier, lang))
      const assistantDeatil: AssistantDetail = await response.json()
      onSelect(assistantDeatil.config.systemRole)
    },
    [lang, assistantIndexUrl, handleClose, onSelect],
  )

  const handleSearch = useCallback(
    (keyword: string) => {
      const result = search(keyword, filterDataByTag(assistants, currentTag))
      setAssistantList(result)
    },
    [assistants, currentTag],
  )

  const handleClear = useCallback(() => {
    setAssistantList(filterDataByTag(assistants, currentTag))
  }, [currentTag, assistants])

  const handleSelectTag = useCallback(
    (value: string) => {
      setCurrentTag(value)
      setAssistantList(filterDataByTag(assistants, value))
    },
    [assistants],
  )

  const fetchAssistantMarketIndex = useCallback(async () => {
    const assistantMarketUrl = new AssistantMarketUrl(assistantIndexUrl)
    const response = await fetch(assistantMarketUrl.getIndexUrl(lang))
    const assistantMarketIndex: AssistantMarketIndex = await response.json()
    updateAssistants(assistantMarketIndex.agents)
    setAssistantList(assistantMarketIndex.agents)
    setTagList(assistantMarketIndex.tags)
    updateTags(assistantMarketIndex.tags)
    onLoaded()
  }, [lang, assistantIndexUrl, updateAssistants, updateTags, onLoaded])

  useLayoutEffect(() => {
    if (assistantIndexUrl !== '' && assistants.length === 0) {
      fetchAssistantMarketIndex()
    } else {
      setAssistantList(assistants)
      setTagList(tags)
    }
  }, [assistantIndexUrl, assistants, tags, fetchAssistantMarketIndex])

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-screen-md p-0 max-sm:h-full landscape:max-md:h-full">
        <DialogHeader className="p-6 pb-0 max-sm:p-4 max-sm:pb-0">
          <DialogTitle>
            {t('assistantMarket')}
            <small>{t('totalAssistant', { total: assistants.length })}</small>
          </DialogTitle>
          <DialogDescription className="pb-2">{t('assistantMarketDescription')}</DialogDescription>
          <div className="flex gap-2">
            <Select defaultValue="all" onValueChange={(value) => handleSelectTag(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="请选择分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                {tagList.map((tag) => {
                  return (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            <SearchBar onSearch={handleSearch} onClear={() => handleClear()} />
          </div>
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
                    <CardTitle className="flex text-lg">
                      <Avatar className="mr-1 h-7 w-7">
                        {assistant.meta.avatar.startsWith('http') ? (
                          <AvatarImage className="m-1 h-5 w-5 rounded-full" src={assistant.meta.avatar} />
                        ) : null}
                        <AvatarFallback className="bg-transparent">{assistant.meta.avatar}</AvatarFallback>
                      </Avatar>
                      <span className="truncate font-medium">{assistant.meta.title}</span>
                    </CardTitle>
                    <CardDescription className="text-line-clamp-2 h-10">{assistant.meta.description}</CardDescription>
                  </CardHeader>
                  <CardFooter className="flex justify-between p-4 pt-0 text-sm">
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
