import { memo, type ReactNode, type MouseEventHandler } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/utils'

type Props = {
  children: ReactNode
  title?: string
  className?: string
  onClick?: MouseEventHandler<HTMLDivElement>
}

function IconButton({ children, title, className, onClick }: Props) {
  if (title) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn('cursor-pointer rounded-full p-1.5 hover:bg-secondary', className)} onClick={onClick}>
              {children}
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-md:hidden">
            <p>{title}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  } else {
    return (
      <div className={cn('cursor-pointer', className)} onClick={onClick}>
        {children}
      </div>
    )
  }
}

export default memo(IconButton)
