import { useState, useCallback, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshCcw } from 'lucide-react'
import AssistantMarket from '@/components/AssistantMarket'
import Button from '@/components/Button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useAssistantStore } from '@/store/assistant'
import { useSettingStore } from '@/store/setting'
import AssistantMarketUrl from '@/utils/AssistantMarketUrl'

type Props = {
  initAssistant: (instruction: string) => void
}

function CardSkeleton() {
  return (
    <Card className="w-full cursor-pointer transition-colors hover:drop-shadow-md dark:hover:border-white/80">
      <CardHeader className="p-4 pb-2">
        <Skeleton className="my-0.5 h-5 w-[160px]" />
        <Skeleton className="my-0.5 h-4 w-full" />
        <Skeleton className="my-0.5 h-4 w-[100px]" />
      </CardHeader>
    </Card>
  )
}

function AssistantRecommend({ initAssistant }: Props) {
  const { t } = useTranslation()
  const settingStore = useSettingStore()
  const { recommendation } = useAssistantStore()
  const [assistantMarketOpen, setAssistantMarketOpen] = useState<boolean>(false)

  const initAssistantMarket = useCallback(() => {
    const { recommend } = useAssistantStore.getState()
    recommend(4)
  }, [])

  const handleSelectAssistant = useCallback(
    async (identifier: string) => {
      const assistantMarketUrl = new AssistantMarketUrl(settingStore.assistantIndexUrl)
      const response = await fetch(assistantMarketUrl.getAssistantUrl(identifier, settingStore.lang))
      const data: AssistantDetail = await response.json()
      initAssistant(data.config.systemRole)
    },
    [settingStore.lang, settingStore.assistantIndexUrl, initAssistant],
  )

  return (
    <div className="flex grow items-center justify-center p-4 text-sm">
      <section className="-mt-20 w-full max-sm:mt-0">
        <div className="my-3 flex justify-between">
          <h3 className="text-base font-medium">{t('assistantRecommend')}</h3>
          <Button
            className="h-6 w-6 p-1"
            title={t('refresh')}
            variant="ghost"
            size="icon"
            disabled={recommendation.length === 0}
            onClick={() => initAssistantMarket()}
          >
            <RefreshCcw className="h-5 w-5" />
          </Button>
        </div>
        {recommendation.length === 0 ? (
          <div className="grid grid-cols-2 grid-rows-2 gap-2 max-sm:grid-cols-1">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-2 grid-rows-2 gap-2 text-left text-gray-600 max-sm:grid-cols-1">
            {recommendation.map((assistant) => {
              return (
                <Card
                  key={assistant.identifier}
                  className="cursor-pointer transition-colors hover:drop-shadow-md dark:hover:border-white/80"
                  onClick={() => handleSelectAssistant(assistant.identifier)}
                >
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="flex text-base">
                      <Avatar className="mr-1 h-6 w-6">
                        {assistant.meta.avatar.startsWith('http') ? (
                          <AvatarImage className="m-1 h-4 w-4 rounded-full" src={assistant.meta.avatar} />
                        ) : null}
                        <AvatarFallback className="bg-transparent">{assistant.meta.avatar}</AvatarFallback>
                      </Avatar>
                      <span className="truncate font-medium">{assistant.meta.title}</span>
                    </CardTitle>
                    <CardDescription className="text-line-clamp-2 h-10">{assistant.meta.description}</CardDescription>
                  </CardHeader>
                </Card>
              )
            })}
          </div>
        )}
        <div
          className="cursor-pointer pt-3 text-center underline-offset-4 hover:underline"
          onClick={() => setAssistantMarketOpen(true)}
        >
          {t('moreAssistants')}
        </div>
      </section>
      <AssistantMarket
        open={assistantMarketOpen}
        onClose={() => setAssistantMarketOpen(false)}
        onSelect={initAssistant}
        onLoaded={initAssistantMarket}
      />
    </div>
  )
}

export default memo(AssistantRecommend)
