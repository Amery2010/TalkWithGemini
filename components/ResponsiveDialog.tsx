import { memo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import useMediaQuery from '@/hooks/useMediaQuery'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  description: string
  trigger?: ReactNode
  children: ReactNode
  footer?: ReactNode
}

function DrawerDialog({ open, onClose, title, description, trigger, children, footer }: Props) {
  const { t } = useTranslation()
  const isDesktop = useMediaQuery('(min-width: 450px)')

  const handleClose = (open: boolean) => {
    if (!open) onClose()
  }

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
        <DialogContent className="overflow-y-auto landscape:max-md:h-4/5">
          <DialogHeader>
            {title ? <DialogTitle>{title}</DialogTitle> : null}
            {description ? <DialogDescription>{description}</DialogDescription> : null}
          </DialogHeader>
          {children}
          <DialogFooter className="mx-auto w-4/5 flex-col sm:justify-center">
            {footer}
            <DialogClose asChild>
              <Button className="flex-1 max-sm:mt-2" variant="outline">
                {t('cancel')}
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      {trigger ? <DrawerTrigger asChild>{trigger}</DrawerTrigger> : null}
      <DrawerContent>
        <DrawerHeader className="text-left">
          {title ? <DrawerTitle>{title}</DrawerTitle> : null}
          {description ? <DrawerDescription>{description}</DrawerDescription> : null}
        </DrawerHeader>
        {children}
        <DrawerFooter className="pt-2">
          {footer}
          <DrawerClose asChild>
            <Button className="h-9" variant="outline">
              {t('cancel')}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

export default memo(DrawerDialog)
