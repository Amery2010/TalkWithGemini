import { memo } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import FileList from '@/components/FileList'
import { useAttachmentStore } from '@/store/attachment'
import { cn } from '@/utils'

type Props = {
  className: string
}

function AttachmentArea({ className }: Props) {
  const { files, remove: removeAttachment } = useAttachmentStore()

  if (files.length === 0) {
    return null
  }

  return (
    <ScrollArea className={cn('scroll-smooth', className)}>
      <FileList fileList={files} onRemove={removeAttachment} />
    </ScrollArea>
  )
}

export default memo(AttachmentArea)
