'use client'
import { useLayoutEffect } from 'react'
import { useSettingStore } from '@/store/setting'
import { useMessageStore } from '@/store/chat'
import { usePluginStore } from '@/store/plugin'
import { useModelStore } from '@/store/model'

function StoreProvider({ children, isProtected = false }: { children: React.ReactNode; isProtected?: boolean }) {
  const { init: initSettingStore } = useSettingStore()
  const { init: initMessageStore } = useMessageStore()
  const { init: initPluginStore } = usePluginStore()
  const { init: initModelStore } = useModelStore()

  useLayoutEffect(() => {
    initSettingStore(isProtected)
    initMessageStore()
    initPluginStore()
    initModelStore()
  }, [initSettingStore, initMessageStore, initPluginStore, initModelStore, isProtected])
  return children
}

export default StoreProvider
