'use client'
import { useLayoutEffect } from 'react'
import { useSettingStore } from '@/store/setting'
import { useMessageStore } from '@/store/chat'
import { usePluginStore } from '@/store/plugin'

function StoreProvider({ children, isProtected = false }: { children: React.ReactNode; isProtected?: boolean }) {
  const { init: initSettingStore } = useSettingStore()
  const { init: initMessageStore } = useMessageStore()
  const { init: initPluginStore } = usePluginStore()

  useLayoutEffect(() => {
    initSettingStore(isProtected)
    initMessageStore()
    initPluginStore()
  }, [initSettingStore, initMessageStore, initPluginStore, isProtected])
  return children
}

export default StoreProvider
