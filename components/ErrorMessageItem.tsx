import { memo } from 'react'
import { Bot } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

type Props = {
  content: string
}

function ErrorMessageItem({ content }: Props) {
  return (
    <>
      <Avatar className="h-8 w-8">
        <AvatarFallback className="bg-red-300 text-white">
          <Bot />
        </AvatarFallback>
      </Avatar>
      <div className="prose overflow-hidden break-words text-base leading-8">
        <div className="font-semibold text-red-500">{content}</div>
      </div>
    </>
  )
}

export default memo(ErrorMessageItem)
