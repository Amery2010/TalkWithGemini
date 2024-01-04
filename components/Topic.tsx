import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSettingStore } from '@/store/setting'
import topics from '@/constant/topics'

type TopicProps = {
  open: boolean
  onClose: () => void
  onSelect: (topic: Topic) => void
}

function Topic({ open, onClose, onSelect }: TopicProps) {
  const { t } = useTranslation()
  const { lang } = useSettingStore()
  const topicList = useMemo(() => {
    const langType = lang.split('-')[0] === 'zh' ? 'zh' : 'en'
    return topics[langType]
  }, [lang])

  const handleClose = (open: boolean) => {
    if (!open) onClose()
  }
  const handleSelect = (topic: Topic) => {
    onClose()
    onSelect(topic)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-screen-sm p-0 max-sm:h-full landscape:max-md:h-full">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>{t('topicSquare')}</DialogTitle>
          <DialogDescription>{t('selectTopic')}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2 overflow-y-auto scroll-smooth p-6 pt-4 max-sm:grid-cols-none max-sm:p-4">
          {topicList.map((topic, idx) => {
            return (
              <Card key={idx} className="cursor-pointer hover:drop-shadow-md" onClick={() => handleSelect(topic)}>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">{topic.title}</CardTitle>
                  <CardDescription className="text-line-clamp-2">{topic.description}</CardDescription>
                </CardHeader>
              </Card>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default memo(Topic)
