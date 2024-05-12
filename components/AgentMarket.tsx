import { useState, useCallback, useEffect, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardDescription, CardHeader, CardFooter, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import SearchBar from '@/components/SearchBar'
import { useSettingStore } from '@/store/setting'
import { agentMarket } from '@/utils/AgentMarket'

type AgentProps = {
  open: boolean
  onClose: () => void
  onSelect: (prompt: string) => void
  onLoaded: (agentList: Agent[]) => void
}

function search(keyword: string, data: Agent[]): Agent[] {
  const results: Agent[] = []
  // 'i' means case-insensitive
  const regex = new RegExp(keyword.trim(), 'gi')
  data.forEach((item) => {
    if (item.meta.tags.includes(keyword) || regex.test(item.meta.title) || regex.test(item.meta.description)) {
      results.push(item)
    }
  })
  return results
}

function Agent({ open, onClose, onSelect, onLoaded }: AgentProps) {
  const { t } = useTranslation()
  const { lang } = useSettingStore()
  const [reources, setResources] = useState<Agent[]>([])
  const [agentList, setAgentList] = useState<Agent[]>([])

  const handleClose = useCallback(
    (open: boolean) => {
      if (!open) onClose()
    },
    [onClose],
  )

  const handleSelect = useCallback(
    async (agent: Agent) => {
      onClose()
      const response = await fetch(agentMarket.getAgentUrl(agent.identifier, lang))
      const agentDeatil: AgentDetail = await response.json()
      onSelect(agentDeatil.config.systemRole)
    },
    [lang, onClose, onSelect],
  )

  const handleSearch = useCallback(
    (keyword: string) => {
      const result = search(keyword, reources)
      setAgentList(result)
    },
    [reources],
  )

  const fetchAgentMarketIndex = useCallback(async () => {
    const response = await fetch(agentMarket.getIndexUrl(lang))
    const agentMarketIndex = await response.json()
    setResources(agentMarketIndex.agents)
    setAgentList(agentMarketIndex.agents)
    onLoaded(agentMarketIndex.agents)
  }, [lang, onLoaded])

  useEffect(() => {
    fetchAgentMarketIndex()
  }, [fetchAgentMarketIndex])

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-screen-md p-0 max-sm:h-full landscape:max-md:h-full">
        <DialogHeader className="p-6 pb-0 max-sm:p-4 max-sm:pb-0">
          <DialogTitle>{t('topicSquare')}</DialogTitle>
          <DialogDescription className="pb-2">{t('selectTopic')}</DialogDescription>
          <SearchBar onSearch={handleSearch} onClear={() => setAgentList(reources)} />
        </DialogHeader>
        <ScrollArea className="h-[400px] w-full scroll-smooth max-sm:h-full">
          <div className="grid grid-cols-2 gap-2 p-6 pt-0 max-sm:grid-cols-1 max-sm:p-4 max-sm:pt-0">
            {agentList.map((agent) => {
              return (
                <Card
                  key={agent.identifier}
                  className="cursor-pointer transition-colors hover:drop-shadow-md dark:hover:border-white/80"
                  onClick={() => handleSelect(agent)}
                >
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="truncate text-lg">{agent.meta.title}</CardTitle>
                    <CardDescription className="text-line-clamp-2 h-10">{agent.meta.description}</CardDescription>
                  </CardHeader>
                  <CardFooter className="flex justify-between p-4 pt-0">
                    <span>{agent.createAt}</span>
                    <a
                      className="underline-offset-4 hover:underline"
                      href={agent.homepage}
                      target="_blank"
                      onClick={(ev) => ev.stopPropagation()}
                    >
                      @{agent.author}
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

export default memo(Agent)
