'use client'
import { useLayoutEffect } from 'react'
import { useSettingStore } from '@/store/setting'
import { useMessageStore } from '@/store/chat'

function StoreProvider({ children, isProtected = false }: { children: React.ReactNode; isProtected?: boolean }) {
  const { init: initSettingStore } = useSettingStore()
  const { init: initMessageStore } = useMessageStore()

  useLayoutEffect(() => {
    initSettingStore(isProtected)
    initMessageStore()
  }, [initSettingStore, initMessageStore, isProtected])
  return children
}

export default StoreProvider
