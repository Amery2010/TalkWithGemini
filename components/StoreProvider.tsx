'use client'
import { useLayoutEffect } from 'react'
import { useSettingStore } from '@/store/setting'
import { useMessageStore } from '@/store/chat'
import { useModelStore } from '@/store/model'

function StoreProvider({ children, isProtected = false }: { children: React.ReactNode; isProtected?: boolean }) {
  const { init: initSettingStore } = useSettingStore()
  const { init: initMessageStore } = useMessageStore()
  const { init: initModelStore } = useModelStore()

  useLayoutEffect(() => {
    initSettingStore(isProtected)
    initMessageStore()
    initModelStore()
  }, [initSettingStore, initMessageStore, initModelStore, isProtected])
  return children
}

export default StoreProvider
