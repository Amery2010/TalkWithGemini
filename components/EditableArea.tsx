import { memo, useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

type Props = {
  content: string
  isEditing: boolean
  onChange: (content: string) => void
  onCancel: () => void
}

function EditableArea({ content, isEditing, onChange, onCancel }: Props) {
  const { t } = useTranslation()
  const contentRef = useRef<HTMLTextAreaElement>(null)
  const [contentHeight, setContentHeight] = useState<number>(80)

  const handleChange = useCallback(() => {
    if (contentRef.current) {
      onChange(contentRef.current.value)
    }
  }, [onChange])

  const handleCancel = useCallback(() => {
    onCancel()
  }, [onCancel])

  useEffect(() => {
    if (isEditing && contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight + 14)
      contentRef.current.focus()
    }
  }, [isEditing])

  if (!isEditing) return null

  return (
    <>
      <Textarea
        ref={contentRef}
        defaultValue={content}
        className="max-h-[320px] resize-none"
        style={{ height: `${contentHeight}px` }}
      />
      <div className="mt-2 flex justify-end gap-2">
        <Button className="h-8 px-4" variant="secondary" size="sm" onClick={handleCancel}>
          {t('cancel')}
        </Button>
        <Button className="h-8 px-4" size="sm" onClick={handleChange}>
          {t('save')}
        </Button>
      </div>
    </>
  )
}

export default memo(EditableArea)
