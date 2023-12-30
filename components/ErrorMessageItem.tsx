'use client'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { memo } from 'react'

function ErrorMessageItem({ role, content }: Message) {
  return (
    <>
      <Avatar className="h-8 w-8">
        <AvatarFallback>{role === 'user' ? 'User' : 'AI'}</AvatarFallback>
      </Avatar>
      <div className="prose overflow-hidden break-words text-base leading-8">
        <div className="text-red-500">{content}</div>
      </div>
    </>
  )
}

export default memo(ErrorMessageItem)
